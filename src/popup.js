/**
 * Boots localization and preference binding for the extension popup.
 *
 * @returns {void}
 */
(function initializePopup() {
  "use strict";

  const shared = globalThis.GitHubPageJumpShared;
  const label = document.getElementById("ghpj-fixed-label");
  const toggle = document.getElementById("ghpj-fixed-toggle");
  if (!shared || !label || !toggle) {
    return;
  }

  const chromeApi = typeof chrome === "undefined" ? null : chrome;
  const messages = shared.getMessages(shared.getUiLanguage(chromeApi, navigator));
  const settings = shared.createSettingsStore(chromeApi);
  const fixedPaginationSetting = shared.SETTING_NAMES.FIXED_PAGINATION;

  /**
   * Renders the fixed-pagination switch state.
   *
   * @param {boolean} enabled Whether fixed pagination is enabled.
   * @returns {void}
   */
  function render(enabled) {
    toggle.setAttribute("aria-checked", enabled ? "true" : "false");
  }

  /**
   * Optimistically toggles the preference and rolls back failed writes.
   *
   * @returns {Promise<void>}
   */
  async function handleToggleClick() {
    const previousValue = toggle.getAttribute("aria-checked") === "true";
    const nextValue = !previousValue;
    render(nextValue);

    const saved = await settings.set(fixedPaginationSetting, nextValue);
    if (!saved) {
      render(previousValue);
    }
  }

  label.textContent = messages.fixedPagination;
  toggle.disabled = !settings.isAvailable;

  void settings.get(fixedPaginationSetting).then(render);
  settings.subscribe(fixedPaginationSetting, render);

  toggle.addEventListener("click", handleToggleClick);
})();
