/**
 * Copyright (c) Rui Figueira.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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

import type { BrowserContext } from "playwright-core/lib/client/browserContext";
import type { Page } from "playwright-core/lib/client/page";

export type { BrowserContext } from "playwright-core/lib/client/browserContext";
export type { Page } from "playwright-core/lib/client/page";

export interface Crx {
  /**
   * @param options
   */
  start(options?: {
    /**
     * Slows down Playwright operations by the specified amount of milliseconds. Useful so that you can see what is going
     * on.
     */
    slowMo?: number;
  }): Promise<CrxApplication>;
}

export interface CrxApplication {
  /**
   * Attach a tab and returns the corresponding `Page`.
   * @param tabId
   */
  attach(tabId: number): Promise<Page>;

  /**
   * @param options
   */
  attachAll(options?: {
    /**
     * Optional. Whether the tabs are active in their windows.
     */
    active?: null|boolean;

    /**
     * Optional. Whether the tabs are audible. @since Chrome 45.
     */
    audible?: null|boolean;

    /**
     * Optional. Whether the tabs can be discarded automatically by the browser when resources are low. @since Chrome 54.
     */
    autoDiscardable?: null|boolean;

    /**
     * Optional. Whether the tabs are in the current window. @since Chrome 19.
     */
    currentWindow?: null|boolean;

    /**
     * Optional. Whether the tabs are discarded. A discarded tab is one whose content has been unloaded from memory, but
     * is still visible in the tab strip. Its content gets reloaded the next time it's activated. @since Chrome 54.
     */
    discarded?: null|boolean;

    /**
     * Optional. The ID of the group that the tabs are in, or chrome.tabGroups.TAB_GROUP_ID_NONE for ungrouped tabs.
     * @since Chrome 88
     */
    groupId?: null|number;

    /**
     * Optional. Whether the tabs are highlighted.
     */
    highlighted?: null|boolean;

    /**
     * Optional. The position of the tabs within their windows. @since Chrome 18.
     */
    index?: null|number;

    /**
     * Optional. Whether the tabs are in the last focused window. @since Chrome 19.
     */
    lastFocusedWindow?: null|boolean;

    /**
     * Optional. Whether the tabs are muted. @since Chrome 45.
     */
    muted?: null|boolean;

    /**
     * Optional. Whether the tabs are pinned.
     */
    pinned?: null|boolean;

    /**
     * Optional. Whether the tabs have completed loading. One of: "loading", or "complete"
     */
    status?: null|"loading"|"complete"|"serial";

    /**
     * Optional. Match page titles against a pattern.
     */
    title?: null|string;

    /**
     * Optional. Match tabs against one or more URL patterns. Note that fragment identifiers are not matched.
     */
    url?: null|string|Array<string>;

    /**
     * Optional. The ID of the parent window, or `windows.WINDOW_ID_CURRENT` for the current window.
     */
    windowId?: null|number;

    /**
     * Optional. The type of window the tabs are in. One of: "normal", "popup", "panel", "app", or "devtools"
     */
    windowType?: null|"normal"|"popup"|"panel"|"app"|"devtools";
  }): Promise<Array<Page>>;

  /**
   * Detaches all pages and closes.
   */
  close(): Promise<void>;

  /**
   * This method returns browser context that can be used for setting up context-wide routing, etc.
   */
  context(): BrowserContext;

  /**
   * @param tabIdOrPage
   */
  detach(tabIdOrPage: number|Page): Promise<void>;

  /**
   * Detaches all pages.
   */
  detachAll(): Promise<void>;

  /**
   * Creates a chrome tab using
   * [chrome.tabs.create(createProperties)](https://developer.chrome.com/docs/extensions/reference/tabs/#method-create)
   * and attaches it.
   * @param options
   */
  newPage(options?: {
    /**
     * Optional. Whether the tab should become the active tab in the window. Does not affect whether the window is focused
     * (see windows.update). Defaults to true. @since Chrome 16.
     */
    active?: null|boolean;

    /**
     * Optional. The position the tab should take in the window. The provided value will be clamped to between zero and
     * the number of tabs in the window.
     */
    index?: null|number;

    /**
     * Optional. The ID of the tab that opened this tab. If specified, the opener tab must be in the same window as the
     * newly created tab. @since Chrome 18.
     */
    openerTabId?: null|number;

    /**
     * Optional. Whether the tab should be pinned. Defaults to false @since Chrome 9.
     */
    pinned?: null|boolean;

    /**
     * Optional. Whether the tab should become the selected tab in the window. Defaults to true @deprecated since Chrome
     * 33. Please use active.
     */
    selected?: null|boolean;

    /**
     * Optional. The URL to navigate the tab to initially. Fully-qualified URLs must include a scheme (i.e.
     * 'http://www.google.com', not 'www.google.com'). Relative URLs will be relative to the current page within the
     * extension. Defaults to the New Tab Page.
     */
    url?: null|string;

    /**
     * Optional. The window to create the new tab in. Defaults to the current window.
     */
    windowId?: null|number;
  }): Promise<Page>;

  /**
   * Convenience method that returns all the attached pages.
   */
  pages(): Array<Page>;

  recorder: CrxRecorder;
}

export interface CrxRecorder {
  /**
   * Emitted when recorder is hidden.
   */
  on(event: 'hide', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Emitted when recorder is shown.
   */
  on(event: 'show', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Emitted when recorder mode changes.
   */
  on(event: 'modechanged', listener: (data: {
    /**
     * mode
     */
    mode: "none"|"recording"|"inspecting";
  }) => void): this;

  /**
   * Adds an event listener that will be automatically removed after it is triggered once. See `addListener` for more information about this event.
   */
  once(event: 'hide', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Adds an event listener that will be automatically removed after it is triggered once. See `addListener` for more information about this event.
   */
  once(event: 'show', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Adds an event listener that will be automatically removed after it is triggered once. See `addListener` for more information about this event.
   */
  once(event: 'modechanged', listener: (data: {
    /**
     * mode
     */
    mode: "none"|"recording"|"inspecting";
  }) => void): this;

  /**
   * Emitted when recorder is hidden.
   */
  addListener(event: 'hide', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Emitted when recorder is shown.
   */
  addListener(event: 'show', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Emitted when recorder mode changes.
   */
    addListener(event: 'modechanged', listener: (data: {
      /**
       * mode
       */
      mode: "none"|"recording"|"inspecting";
    }) => void): this;

  /**
   * Removes an event listener added by `on` or `addListener`.
   */
  removeListener(event: 'hide', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Removes an event listener added by `on` or `addListener`.
   */
  removeListener(event: 'show', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Removes an event listener added by `on` or `addListener`.
   */
  removeListener(event: 'modechanged', listener: (data: {
    /**
     * mode
     */
    mode: "none"|"recording"|"inspecting";
  }) => void): this;

  /**
   * Removes an event listener added by `on` or `addListener`.
   */
  off(event: 'hide', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Removes an event listener added by `on` or `addListener`.
   */
  off(event: 'show', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Removes an event listener added by `on` or `addListener`.
   */
  off(event: 'modechanged', listener: (data: {
    /**
     * mode
     */
    mode: "none"|"recording"|"inspecting";
  }) => void): this;

  /**
   * Emitted when recorder is hidden.
   */
  prependListener(event: 'hide', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Emitted when recorder is shown.
   */
  prependListener(event: 'show', listener: (crxRecorder: CrxRecorder) => void): this;

  /**
   * Emitted when recorder mode changes.
   */
  prependListener(event: 'modechanged', listener: (data: {
    /**
     * mode
     */
    mode: "none"|"recording"|"inspecting";
  }) => void): this;

  hide(): Promise<void>;

  isHidden(): boolean;

  /**
   * @param options
   */
  show(options?: {
    language?: null|string;

    mode?: null|"none"|"recording"|"inspecting";

    testIdAttributeName?: null|string;
  }): Promise<void>;

  mode: "none"|"recording"|"inspecting";
}
