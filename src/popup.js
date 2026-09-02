(function initializePopup() {
  "use strict";

  const core = globalThis.GitHubPageJumpCore;
  if (!core) {
    return;
  }

  const STORAGE_KEY = "fixedPagination";
  const DEFAULTS = { [STORAGE_KEY]: false };
  const LOCALES = {
    zh: { label: "固定分页器" },
    en: { label: "Fixed pagination" }
  };

  const toggle = document.getElementById("ghpj-fixed-toggle");
  const label = document.getElementById("ghpj-fixed-label");

  // 与内容脚本一致，统一按浏览器界面语言选择文案
  const uiLanguage =
    typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getUILanguage
      ? chrome.i18n.getUILanguage()
      : navigator.language || "";
  const locale = core.isChineseLanguage(uiLanguage) ? LOCALES.zh : LOCALES.en;
  if (label) {
    label.textContent = locale.label;
  }

  if (
    typeof chrome === "undefined" ||
    !chrome.storage ||
    !chrome.storage.sync
  ) {
    return;
  }

  chrome.storage.sync.get(DEFAULTS, (result) => {
    if (chrome.runtime.lastError) {
      return;
    }

    toggle.setAttribute(
      "aria-checked",
      Boolean(result[STORAGE_KEY]) ? "true" : "false"
    );
  });

  toggle.addEventListener("click", () => {
    const checked = toggle.getAttribute("aria-checked") !== "true";
    toggle.setAttribute("aria-checked", checked ? "true" : "false");
    chrome.storage.sync.set({ [STORAGE_KEY]: checked }, () => {
      void chrome.runtime.lastError;
    });
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes[STORAGE_KEY]) {
      return;
    }

    toggle.setAttribute(
      "aria-checked",
      Boolean(changes[STORAGE_KEY].newValue) ? "true" : "false"
    );
  });
})();
