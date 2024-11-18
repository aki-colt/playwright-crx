import type { JsonConfig, JsonProject, JsonSuite, TeleReporterReceiver } from '@testIsomorphic/teleReceiver';
import { sha1 } from './sha1';
import { VirtualDirectory, VirtualFile, VirtualFs } from '../utils/virtualFs';
import { parse } from './parser';
import { extractTestScript, scriptToCode } from './script';
import { loadTrace } from '../sw/crxMain';

export class ExtendedProjectVirtualFs implements VirtualFs {
  private _wrappedFs: VirtualFs;
  
  constructor(fs: VirtualFs) {
    this._wrappedFs = fs;
  }

  root(): VirtualDirectory {
    return this._wrappedFs.root();
  }

  async checkPermission(mode: FileSystemPermissionMode): Promise<boolean> {
    return this._wrappedFs.checkPermission(mode);
  }

  async getFile(path: string): Promise<VirtualFile | undefined> {
    const fileOrAlternativePaths = await this._resolvePath(path);
    if (!fileOrAlternativePaths)
      return;
    if (!Array.isArray(fileOrAlternativePaths))
      return fileOrAlternativePaths;
    const [zipPath] = fileOrAlternativePaths;
    const zipFile = await this._wrappedFs.getFile(zipPath);
    if (!zipFile)
      return;
    return { kind: 'file', name: zipFile.name.replace(/.zip$/, '.ts'), path };
  }

  async listFiles(path?: string): Promise<VirtualFile[]> {
    const files = await this._wrappedFs.listFiles(path);
    const filenames = new Set(files.map(f => f.name));
    const virtualFiles = files.filter(f => {
      return f.kind === 'file' && f.name.endsWith('.zip') &&
        !(filenames.has(f.name.replace(/\.zip$/, '.ts')) || filenames.has(f.name.replace(/\.zip$/, '.js')))
    }).map(f => ({ kind: 'file', name: f.name.replace(/\.zip$/, '.ts'), path: f.path.replace(/\.zip$/, '.ts') } satisfies VirtualFile));
    return [...files, ...virtualFiles];
  }

	async readFile(filePath: string, options: { encoding: 'utf-8' }): Promise<string>;
	async readFile(filePath: string): Promise<Blob>;
	async readFile(filePath: string, options?: { encoding: 'utf-8' }): Promise<string | Blob> {
    const fileOrAlternativePaths = await this._resolvePath(filePath);
    if (!fileOrAlternativePaths)
      throw new Error(`File not found: ${filePath}`);
    if (!Array.isArray(fileOrAlternativePaths))
      return options ? this._wrappedFs.readFile(filePath, options) : this._wrappedFs.readFile(filePath);

    const [zipPath, jsonPath] = fileOrAlternativePaths;

    let title = 'test';
    if (jsonPath) {
      try {
        const jsonData = await this._wrappedFs.readFile(jsonPath, { encoding: 'utf-8' });
        title = JSON.parse(jsonData)?.title ?? 'test';
      } catch (e) {
        // oh well...
      }
    }

    const traceModel = await loadTrace(zipPath, null, 'sw', 1, () => {});
    const [contextEntry] = traceModel.contextEntries;
    const script = extractTestScript(contextEntry, { title });
    const code = scriptToCode(script);
    return code;
  }

  async writeFile() {
    throw new Error('ProjectVirtualFs does not support write operations');
  }

  async _resolvePath(path: string): Promise<VirtualFile | [string, string] | undefined> {
    if (/\.(js|ts)$/.test(path)) {
      const file = await this._wrappedFs.getFile(path);
      return file ?? [path.replace(/\.(js|ts)$/, '.zip'), path.replace(/\.(js|ts)$/, '.json')];
    }

    return await this._wrappedFs.getFile(path);
  }
}

type TeleReporterReceiverEventMap = {
  onConfigure: {
    method: 'onConfigure';
    params: {
      config: Parameters<TeleReporterReceiver['_onConfigure']>[0];
    };
  };
  onProject: {
    method: 'onProject';
    params: {
      project: Parameters<TeleReporterReceiver['_onProject']>[0];
    };
  };
  onBegin: {
    method: 'onBegin';
    params: {};
  };
  onTestBegin: {
    method: 'onTestBegin';
    params: {
      testId: Parameters<TeleReporterReceiver['_onTestBegin']>[0];
      result: Parameters<TeleReporterReceiver['_onTestBegin']>[1];
    };
  };
  onEnd: {
    method: 'onEnd';
    params: {
      result: Parameters<TeleReporterReceiver['_onEnd']>[0];
    };
  };
  onTestEnd: {
    method: 'onTestEnd';
    params: {
      test: Parameters<TeleReporterReceiver['_onTestEnd']>[0];
      result: Parameters<TeleReporterReceiver['_onTestEnd']>[1];
    };
  };
};

type TeleReporterReceiverEvent = TeleReporterReceiverEventMap[keyof TeleReporterReceiverEventMap];
export type TeleReporter = TeleReporterReceiverEvent[];

function generateHexString(length: number = 32) {
  let hexString = '';
  for (let i = 0; i < length; i++) {
      hexString += Math.floor(Math.random() * 16).toString(16);
  }
  return hexString;
}

function generateTestId(testFilepath: string, title: string) {
  const fileId = sha1(testFilepath).slice(0, 20);
  const testIdExpression = `[project=]${testFilepath}\x1e${title}`;
  const testId = fileId + '-' + sha1(testIdExpression).slice(0, 20);
  return testId;
}

async function getSuitesRecursively(fs: VirtualFs, directory: VirtualFile = fs.root()): Promise<JsonSuite[]> {
  const children = await fs.listFiles(directory.path);
  const files = children.filter(h => h.kind === 'file');
  const jsFiles = files.filter(f => /\.(ts|js)$/.test(f.name));
  
  const jsEntries = await Promise.all(jsFiles.map(async jsFile => {
    const code = await fs.readFile(jsFile.path, { encoding: 'utf-8' });
    const parsed = parse(code, jsFile.path, 'data-testid');
    return {
      title: jsFile.path,
      location: { file: jsFile.path, column: 0, line: 0 },
      entries: parsed.tests.map(({ title, location }) => ({
        testId: generateTestId(jsFile.path, title),
        title,
        location: { ...location, column: 0, line: location.line ?? 0 },
        retries: 0,
        tags: [],
        repeatEachIndex: 0,
        annotations: []
      })),
    } satisfies JsonSuite;
  }));
  
  const directories = children.filter(h => h.kind === 'directory');
  const directoryEntries = await Promise.all(directories.map(d => getSuitesRecursively(fs, d)));
  return [...jsEntries, ...directoryEntries.flatMap(e => e)];
}

export async function readReport(fs: VirtualFs): Promise<TeleReporter> {
  const startTime = new Date().getTime(); 

  const config = {
    configFile: '../playwright.config.ts',
    globalTimeout: 0,
    maxFailures: 0,
    metadata: {},
    rootDir: '',
    version: '1.48.2',
    workers: 1
  } satisfies JsonConfig;

  const suites = await getSuitesRecursively(fs);

  const project: JsonProject = {
    metadata: {},
    name: 'chromium',
    outputDir: 'test-results',
    repeatEach: 1,
    retries: 0,
    testDir: '',
    testIgnore: [],
    testMatch: [{ s: '**/*.@(spec|test).?(c|m)[jt]s?(x)' }],
    timeout: 30000,
    suites,
    grep: [{ r: { source: '.*', flags: '' } }],
    grepInvert: [],
    dependencies: [],
    snapshotDir: ''
  };

  return [
    { method: 'onConfigure', params: { config } },
    { method: 'onProject', params: { project } },
    { method: 'onBegin', params: {} },
    {
      method: 'onEnd', params: {
        result: {
          status: 'passed',
          startTime,
          duration: new Date().getTime() - startTime,
        }
      }
    },
  ];
}
