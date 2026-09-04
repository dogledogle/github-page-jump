/**
 * Boots the content-script services for the current GitHub document.
 *
 * @returns {void}
 */
(function initializeContentScript() {
  "use strict";

  const pagination = globalThis.GitHubPageJumpPagination;
  const shared = globalThis.GitHubPageJumpShared;
  if (!pagination || !shared) {
    return;
  }

  const chromeApi = typeof chrome === "undefined" ? null : chrome;
  const messages = shared.getMessages(shared.getUiLanguage(chromeApi, navigator));
  const settings = shared.createSettingsStore(chromeApi);
  const fixedPaginationSetting = shared.SETTING_NAMES.FIXED_PAGINATION;
  const controller = pagination.createPaginationController({
    document,
    labels: messages,
    window
  });

  controller.start();
  void settings.get(fixedPaginationSetting).then(controller.setFixedMode);
  settings.subscribe(fixedPaginationSetting, controller.setFixedMode);
})();
