"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const shared = require("../src/shared.js");

function createChromeApi(initialValues = {}) {
  const listeners = new Set();
  const values = { ...initialValues };

  return {
    i18n: {
      getUILanguage: () => "zh-CN"
    },
    runtime: {
      lastError: null
    },
    storage: {
      onChanged: {
        addListener: (listener) => listeners.add(listener),
        removeListener: (listener) => listeners.delete(listener)
      },
      sync: {
        get(defaults, callback) {
          callback({ ...defaults, ...values });
        },
        set(update, callback) {
          const changes = {};
          for (const [key, newValue] of Object.entries(update)) {
            changes[key] = { newValue, oldValue: values[key] };
            values[key] = newValue;
          }

          callback();
          listeners.forEach((listener) => listener(changes, "sync"));
        }
      }
    }
  };
}

test("selects localized messages from the browser UI language", () => {
  assert.equal(shared.isChineseLanguage("zh-CN"), true);
  assert.equal(shared.isChineseLanguage("ZH-tw"), true);
  assert.equal(shared.isChineseLanguage("en"), false);
  assert.equal(shared.getMessages("zh-HK").fixedPagination, "固定分页器");
  assert.equal(shared.getMessages("fr").fixedPagination, "Fixed pagination");
});

test("prefers Chrome UI language and falls back to navigator language", () => {
  const chromeApi = createChromeApi();

  assert.equal(shared.getUiLanguage(chromeApi, { language: "en-US" }), "zh-CN");
  assert.equal(shared.getUiLanguage(null, { language: "en-US" }), "en-US");
});

test("uses setting defaults when Chrome storage is unavailable", async () => {
  const store = shared.createSettingsStore(null);
  const setting = shared.SETTING_NAMES.FIXED_PAGINATION;

  assert.equal(store.isAvailable, false);
  assert.equal(await store.get(setting), false);
  assert.equal(await store.set(setting, true), false);
});

test("reads, writes, normalizes, and observes registered settings", async () => {
  const chromeApi = createChromeApi({ fixedPagination: 1 });
  const store = shared.createSettingsStore(chromeApi);
  const setting = shared.SETTING_NAMES.FIXED_PAGINATION;
  const observedValues = [];
  const unsubscribe = store.subscribe(setting, (value) => observedValues.push(value));

  assert.equal(await store.get(setting), true);
  assert.equal(await store.set(setting, 0), true);
  assert.deepEqual(observedValues, [false]);

  unsubscribe();
  await store.set(setting, true);
  assert.deepEqual(observedValues, [false]);
});

test("rejects settings that are not in the shared registry", () => {
  const store = shared.createSettingsStore(null);
  assert.throws(() => store.get("missingSetting"), /Unknown setting/);
});
