/**
 * @typedef {Object} LocaleMessages
 * @property {string} firstPage Label for the first-page control.
 * @property {string} fixedPagination Label for the fixed-pagination preference.
 * @property {(lastPage: number) => string} invalidPage Formats page-range validation text.
 * @property {string} jumpToPage Label for the direct-jump control.
 * @property {string} lastPage Label for the last-page control.
 * @property {string} pageInput Label for the page-number input.
 * @property {string} pageJumpGroup Label for the page-jump control group.
 */

/**
 * @typedef {Object} SettingDefinition
 * @property {*} defaultValue Value used when storage has no entry or is unavailable.
 * @property {(value: *) => *} normalize Converts stored and incoming values.
 * @property {string} storageKey Key used by chrome.storage.sync.
 */

/**
 * @typedef {Object} SettingsStore
 * @property {(name: string) => Promise<*>} get Reads a registered setting.
 * @property {boolean} isAvailable Whether synchronized Chrome storage is available.
 * @property {(name: string, value: *) => Promise<boolean>} set Writes a registered setting.
 * @property {(name: string, listener: function(*): void) => (() => void)} subscribe Observes a registered setting.
 */

/**
 * Publishes shared localization and preference services.
 *
 * @param {object} root The global object that receives the browser API.
 * @param {() => object} factory Creates the shared API.
 * @returns {void}
 */
(function initializeShared(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.GitHubPageJumpShared = api;
})(typeof globalThis !== "undefined" ? globalThis : this, /**
 * Creates the shared localization and settings API.
 *
 * @returns {object} The public shared API.
 */
function createShared() {
  "use strict";

  const SETTING_NAMES = Object.freeze({
    FIXED_PAGINATION: "fixedPagination"
  });

  const SETTING_DEFINITIONS = Object.freeze({
    [SETTING_NAMES.FIXED_PAGINATION]: Object.freeze({
      defaultValue: false,
      normalize: Boolean,
      storageKey: "fixedPagination"
    })
  });

  /**
   * Formats the English invalid-page message.
   *
   * @param {number} lastPage The highest selectable page.
   * @returns {string} The localized validation message.
   */
  function formatInvalidPageEnglish(lastPage) {
    return `Enter a whole number from 1 to ${lastPage}`;
  }

  /**
   * Formats the Chinese invalid-page message.
   *
   * @param {number} lastPage The highest selectable page.
   * @returns {string} The localized validation message.
   */
  function formatInvalidPageChinese(lastPage) {
    return `请输入 1 到 ${lastPage} 之间的整数`;
  }

  const MESSAGES = Object.freeze({
    en: Object.freeze({
      firstPage: "Go to first page",
      fixedPagination: "Fixed pagination",
      invalidPage: formatInvalidPageEnglish,
      jumpToPage: "Jump to page",
      lastPage: "Go to last page",
      pageInput: "Enter a page number and press Enter",
      pageJumpGroup: "Page jump"
    }),
    zh: Object.freeze({
      firstPage: "跳转到第一页",
      fixedPagination: "固定分页器",
      invalidPage: formatInvalidPageChinese,
      jumpToPage: "跳转到输入的页码",
      lastPage: "跳转到最后一页",
      pageInput: "输入页码后按回车跳转",
      pageJumpGroup: "页码跳转"
    })
  });

  /**
   * Checks whether a browser language tag represents Chinese.
   *
   * @param {*} language The language tag to inspect.
   * @returns {boolean} True for Chinese language tags.
   */
  function isChineseLanguage(language) {
    return typeof language === "string" && language.toLowerCase().startsWith("zh");
  }

  /**
   * Selects the supported message bundle for a browser language.
   *
   * @param {*} language The browser language tag.
   * @returns {LocaleMessages} The Chinese or English message bundle.
   */
  function getMessages(language) {
    return isChineseLanguage(language) ? MESSAGES.zh : MESSAGES.en;
  }

  /**
   * Reads the browser UI language, falling back to navigator.language.
   *
   * @param {object|null} chromeApi The Chrome extension API, when available.
   * @param {object|null} navigatorApi The browser navigator object, when available.
   * @returns {string} The detected UI language or an empty string.
   */
  function getUiLanguage(chromeApi, navigatorApi) {
    const getChromeLanguage = chromeApi && chromeApi.i18n && chromeApi.i18n.getUILanguage;
    if (typeof getChromeLanguage === "function") {
      return getChromeLanguage.call(chromeApi.i18n) || "";
    }

    return (navigatorApi && navigatorApi.language) || "";
  }

  /**
   * Resolves a registered setting definition.
   *
   * @param {string} name The public setting name.
   * @returns {SettingDefinition} The registered definition.
   * @throws {RangeError} When the setting is not registered.
   */
  function getSettingDefinition(name) {
    const definition = SETTING_DEFINITIONS[name];
    if (!definition) {
      throw new RangeError(`Unknown setting: ${name}`);
    }

    return definition;
  }

  /**
   * Creates a normalized adapter around chrome.storage.sync.
   *
   * @param {object|null} chromeApi The Chrome extension API, when available.
   * @returns {SettingsStore} The settings service.
   */
  function createSettingsStore(chromeApi) {
    const storage = chromeApi && chromeApi.storage;
    const storageArea = storage && storage.sync;
    const changeEvent = storage && storage.onChanged;
    const runtime = chromeApi && chromeApi.runtime;
    const isAvailable = Boolean(storageArea);

    /**
     * Checks for a Chrome runtime error inside an API callback.
     *
     * @returns {boolean} True when the current callback has an error.
     */
    function hasRuntimeError() {
      // Chrome exposes lastError only while the storage callback is running.
      return Boolean(runtime && runtime.lastError);
    }

    /**
     * Reads and normalizes a registered setting.
     *
     * @param {string} name The public setting name.
     * @returns {Promise<*>} The stored value or its registered default.
     */
    function get(name) {
      const definition = getSettingDefinition(name);
      if (!isAvailable) {
        return Promise.resolve(definition.defaultValue);
      }

      return new Promise((resolve) => {
        const defaults = { [definition.storageKey]: definition.defaultValue };
        storageArea.get(defaults, (result) => {
          const value = hasRuntimeError()
            ? definition.defaultValue
            : result[definition.storageKey];
          resolve(definition.normalize(value));
        });
      });
    }

    /**
     * Writes a normalized value for a registered setting.
     *
     * @param {string} name The public setting name.
     * @param {*} value The value to normalize and store.
     * @returns {Promise<boolean>} Whether the storage operation succeeded.
     */
    function set(name, value) {
      const definition = getSettingDefinition(name);
      if (!isAvailable) {
        return Promise.resolve(false);
      }

      return new Promise((resolve) => {
        const update = { [definition.storageKey]: definition.normalize(value) };
        storageArea.set(update, () => resolve(!hasRuntimeError()));
      });
    }

    /**
     * Provides a stable unsubscribe function when change events are unavailable.
     *
     * @returns {void}
     */
    function unsubscribeNoop() {}

    /**
     * Observes changes to a registered synchronized setting.
     *
     * @param {string} name The public setting name.
     * @param {function(*): void} listener Receives normalized setting values.
     * @returns {() => void} Removes the storage listener.
     */
    function subscribe(name, listener) {
      const definition = getSettingDefinition(name);
      if (!changeEvent || typeof changeEvent.addListener !== "function") {
        return unsubscribeNoop;
      }

      /**
       * Filters Chrome storage changes for the subscribed setting.
       *
       * @param {Object<string, {newValue: *}>} changes Changed storage entries.
       * @param {string} areaName The Chrome storage area name.
       * @returns {void}
       */
      const handleChange = (changes, areaName) => {
        const change = areaName === "sync" && changes[definition.storageKey];
        if (change) {
          listener(definition.normalize(change.newValue));
        }
      };

      changeEvent.addListener(handleChange);

      /**
       * Removes the registered Chrome storage change listener.
       *
       * @returns {void}
       */
      return function unsubscribe() {
        if (typeof changeEvent.removeListener === "function") {
          changeEvent.removeListener(handleChange);
        }
      };
    }

    return Object.freeze({ get, isAvailable, set, subscribe });
  }

  return {
    MESSAGES,
    SETTING_DEFINITIONS,
    SETTING_NAMES,
    createSettingsStore,
    getMessages,
    getUiLanguage,
    isChineseLanguage
  };
});
