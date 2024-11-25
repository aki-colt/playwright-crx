/**
 * Copyright (c) Rui Figueira.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { test } from './crxTest';

test.skip(({ enabledInIncognito }) => !enabledInIncognito);

test('should isolate cookies from incognito', async ({ runCrxTest }) => {
  await runCrxTest(async ({ crx, page, server, expect }) => {
    await page.goto(server.EMPTY_PAGE);
    await page.context().addCookies([{ url: server.EMPTY_PAGE, name: 'foo', value: 'bar' }]);
    expect(await page.context().cookies()).toHaveLength(1);
    const incognitoApp = await crx.start({ incognito: true });
    const incognitoPage = await incognitoApp.newPage();
    await incognitoPage.goto(server.EMPTY_PAGE);
    expect(await incognitoApp.context().cookies()).toHaveLength(0);
    await incognitoApp.context().addCookies([{ url: server.EMPTY_PAGE, name: 'incognito', value: 'true' }]);
    expect(await page.context().cookies()).toHaveLength(1);
    expect(await incognitoApp.context().cookies()).toHaveLength(1);
    await incognitoApp.close();
  });
});
