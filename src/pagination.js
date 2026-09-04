/**
 * @typedef {Object} PaginationAdapter
 * @property {string|null} hostSelector Selector for the element that receives controls.
 * @property {boolean} legacy Whether the structure uses legacy hover styling.
 * @property {string} selector Selector that identifies the pagination root.
 */

/**
 * @typedef {PageDescriptor & {element: Element}} DomPageDescriptor
 */

/**
 * @typedef {Object} PaginationControllerOptions
 * @property {Document} document The page document to enhance.
 * @property {LocaleMessages} labels Localized labels for injected controls.
 * @property {Window} window The page window used for navigation and events.
 * @property {typeof MutationObserver} [MutationObserver] Optional observer implementation.
 * @property {(callback: FrameRequestCallback) => number} [scheduleFrame] Optional frame scheduler.
 * @property {(handle: number) => void} [cancelFrame] Optional frame cancellation function.
 */

/**
 * @typedef {Object} PaginationController
 * @property {() => void} scan Immediately enhances all supported paginators.
 * @property {() => void} scheduleScan Schedules one coalesced DOM scan.
 * @property {(enabled: boolean) => void} setFixedMode Applies the fixed-mode preference.
 * @property {() => void} start Starts observation and performs the initial scan.
 * @property {() => void} stop Removes observers, listeners, and scheduled work.
 */

/**
 * Publishes the GitHub pagination DOM adapter.
 *
 * @param {object} root The global object that receives the browser API.
 * @param {(core: object|null) => object|null} factory Creates the pagination API.
 * @returns {void}
 */
(function initializePagination(root, factory) {
  const core =
    typeof module === "object" && module.exports
      ? require("./core.js")
      : root.GitHubPageJumpCore;
  const api = factory(core);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.GitHubPageJumpPagination = api;
})(typeof globalThis !== "undefined" ? globalThis : this, /**
 * Creates the pagination DOM API around the pure core helpers.
 *
 * @param {object|null} core The core pagination API.
 * @returns {object|null} The public pagination API, or null without the core dependency.
 */
function createPagination(core) {
  "use strict";

  if (!core) {
    return null;
  }

  const CONTROL_CLASS = "ghpj-controls";
  const FIXED_CLASS = "ghpj-pagination--fixed";
  const LEGACY_STYLE_SELECTOR =
    ".paginate-container, .pagination, .previous_page, .next_page";
  const OUTLINE_CLASS = "ghpj-controls--outline";

  // GitHub currently serves both React and legacy Rails pagination structures.
  // Keep structure-specific behavior in this ordered adapter list.
  const PAGINATION_ADAPTERS = Object.freeze([
    Object.freeze({
      hostSelector: "[data-hidden-viewport-ranges]",
      legacy: false,
      selector: 'nav[data-component="Pagination"]'
    }),
    Object.freeze({
      hostSelector: null,
      legacy: false,
      selector: 'nav[aria-label="Pagination"]'
    }),
    Object.freeze({
      hostSelector: ":scope > .pagination",
      legacy: true,
      selector: ".paginate-container"
    })
  ]);
  const PAGINATION_SELECTOR = PAGINATION_ADAPTERS.map(({ selector }) => selector).join(",");

  const ICONS = Object.freeze({
    first:
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.75 3a.75.75 0 0 1 .75.75v8a.75.75 0 0 1-1.5 0V3.75a.75.75 0 0 1 .75-.75Zm8.03 9.78a.75.75 0 0 1-1.06 0L6.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L8.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z"/></svg>',
    jump:
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H1.75a.75.75 0 0 1 0-1.5h9.44L8.22 4.03a.75.75 0 0 1 0-1.06Z"/></svg>',
    last:
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.25 3A.75.75 0 0 1 13 3.75v8a.75.75 0 0 1-1.5 0V3.75a.75.75 0 0 1 .75-.75Zm-8.03 9.78a.75.75 0 0 0 1.06 0L9.53 8.53a.75.75 0 0 0 0-1.06l-4.25-4.25a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L7.94 8l-3.72 3.72a.75.75 0 0 0 0 1.06Z"/></svg>'
  });

  /**
   * Creates a lifecycle-managed controller for one document.
   *
   * @param {PaginationControllerOptions} options Browser dependencies and localized labels.
   * @returns {PaginationController} The pagination controller.
   * @throws {TypeError} When a required dependency is missing.
   */
  function createPaginationController(options) {
    if (!options || !options.document || !options.labels || !options.window) {
      throw new TypeError("document, labels, and window are required");
    }

    const documentObject = options.document;
    const labels = options.labels;
    const windowObject = options.window;
    const MutationObserverClass = options.MutationObserver || windowObject.MutationObserver;
    const scheduleFrame =
      options.scheduleFrame || windowObject.requestAnimationFrame.bind(windowObject);
    const cancelFrame =
      options.cancelFrame || windowObject.cancelAnimationFrame.bind(windowObject);

    let fixedEnabled = false;
    let observer = null;
    let scheduledFrame = null;
    let started = false;

    /**
     * Resolves the adapter for a pagination root.
     *
     * @param {Element} pagination The pagination root element.
     * @returns {PaginationAdapter|undefined} The first matching adapter.
     */
    function getAdapter(pagination) {
      return PAGINATION_ADAPTERS.find(({ selector }) => pagination.matches(selector));
    }

    /**
     * Resolves the element that should contain injected controls.
     *
     * @param {Element} pagination The pagination root element.
     * @returns {Element} The adapter-specific host or the root itself.
     */
    function getHost(pagination) {
      const adapter = getAdapter(pagination);
      const adaptedHost =
        adapter && adapter.hostSelector && pagination.querySelector(adapter.hostSelector);
      return adaptedHost || pagination;
    }

    /**
     * Determines whether controls should match legacy outline hover behavior.
     *
     * @param {Element} pagination The pagination root element.
     * @param {PaginationAdapter|undefined} adapter The matched structure adapter.
     * @returns {boolean} True when legacy control styling is required.
     */
    function usesLegacyStyle(pagination, adapter) {
      return Boolean(
        (adapter && adapter.legacy) ||
          pagination.matches(LEGACY_STYLE_SELECTOR) ||
          pagination.querySelector(LEGACY_STYLE_SELECTOR)
      );
    }

    /**
     * Extracts normalized page descriptors from GitHub pagination markup.
     *
     * @param {Element} pagination The pagination root element.
     * @returns {DomPageDescriptor[]} The descriptors containing valid page numbers.
     */
    function collectDescriptors(pagination) {
      return Array.from(pagination.querySelectorAll("a, span, em"))
        .map((element) => ({
          current:
            element.getAttribute("aria-current") === "page" ||
            element.classList.contains("current"),
          element,
          href: element.getAttribute("href") || "",
          page: core.readPageNumber({
            ariaLabel: element.getAttribute("aria-label") || "",
            text: element.textContent.trim()
          })
        }))
        .filter(({ page }) => page !== null);
    }

    /**
     * Reads GitHub's declared total page count from pagination markup.
     *
     * @param {Element} pagination The pagination root element.
     * @returns {string|null} The declared total, or null when absent.
     */
    function getDeclaredTotal(pagination) {
      const element = pagination.querySelector("[data-total-pages]");
      return element ? element.getAttribute("data-total-pages") : null;
    }

    /**
     * Creates an accessible icon-only button.
     *
     * @param {"first"|"jump"|"last"} kind The icon and default class variant.
     * @param {string} label The accessible name and tooltip.
     * @param {string} [className] An optional class override.
     * @returns {HTMLButtonElement} The configured button.
     */
    function createIconButton(kind, label, className) {
      const button = documentObject.createElement("button");
      button.type = "button";
      button.className = className || `ghpj-button ghpj-button--${kind}`;
      button.setAttribute("aria-label", label);
      button.title = label;
      button.innerHTML = ICONS[kind];
      return button;
    }

    /**
     * Navigates through an exact native link when possible, otherwise through a built URL.
     *
     * @param {Element} pagination The pagination root element.
     * @param {number} targetPage The destination page number.
     * @returns {void}
     */
    function navigate(pagination, targetPage) {
      const descriptors = collectDescriptors(pagination);
      const exactLink = descriptors.find(
        ({ element, page }) => page === targetPage && element.matches("a[href]")
      );

      if (exactLink) {
        exactLink.element.click();
        return;
      }

      const targetUrl = core.buildPageUrl(
        descriptors,
        windowObject.location.href,
        targetPage
      );
      windowObject.location.assign(targetUrl);
    }

    /**
     * Updates native input validity and its accessible invalid state.
     *
     * @param {HTMLInputElement} input The page-number input.
     * @param {string} message The validation message, or an empty string to clear it.
     * @returns {void}
     */
    function setValidity(input, message) {
      input.setCustomValidity(message);
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    /**
     * Creates the control group placed before native pagination items.
     *
     * @param {Element} pagination The pagination root element.
     * @returns {HTMLDivElement} The first-page control group.
     */
    function createStartControls(pagination) {
      const controls = documentObject.createElement("div");
      controls.className = `${CONTROL_CLASS} ${CONTROL_CLASS}--start`;

      const firstButton = createIconButton("first", labels.firstPage);
      firstButton.addEventListener("click", () => navigate(pagination, 1));
      controls.append(firstButton);
      return controls;
    }

    /**
     * Creates the control group placed after native pagination items.
     *
     * @param {Element} pagination The pagination root element.
     * @returns {HTMLDivElement} The last-page and direct-jump controls.
     */
    function createEndControls(pagination) {
      const controls = documentObject.createElement("div");
      controls.className = `${CONTROL_CLASS} ${CONTROL_CLASS}--end`;
      controls.setAttribute("role", "group");
      controls.setAttribute("aria-label", labels.pageJumpGroup);

      const input = documentObject.createElement("input");
      input.className = "ghpj-input";
      input.type = "text";
      input.inputMode = "numeric";
      input.pattern = "[0-9]*";
      input.autocomplete = "off";
      input.setAttribute("aria-label", labels.pageInput);
      input.title = labels.pageInput;

      const jumpButton = createIconButton("jump", labels.jumpToPage, "ghpj-jumpbox-button");
      const lastButton = createIconButton("last", labels.lastPage);

      /**
       * Validates and submits the current direct-jump input value.
       *
       * @returns {void}
       */
      function submitInput() {
        const page = core.parsePositiveInteger(input.value);
        const lastPage = Number(controls.dataset.lastPage);

        if (!page || page > lastPage) {
          setValidity(input, labels.invalidPage(lastPage));
          input.reportValidity();
          return;
        }

        setValidity(input, "");
        navigate(pagination, page);
      }

      jumpButton.addEventListener("click", submitInput);
      lastButton.addEventListener("click", () => {
        navigate(pagination, Number(controls.dataset.lastPage));
      });
      input.addEventListener("input", () => setValidity(input, ""));
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submitInput();
        }
      });

      const jumpbox = documentObject.createElement("div");
      jumpbox.className = "ghpj-jumpbox";
      jumpbox.append(input, jumpButton);
      controls.append(lastButton, jumpbox);
      return controls;
    }

    /**
     * Synchronizes control state with the current native pagination state.
     *
     * @param {Element} pagination The pagination root element.
     * @param {HTMLDivElement} startControls Controls before the native items.
     * @param {HTMLDivElement} endControls Controls after the native items.
     * @returns {void}
     */
    function updateControls(pagination, startControls, endControls) {
      const descriptors = collectDescriptors(pagination);
      if (descriptors.length === 0) {
        startControls.remove();
        endControls.remove();
        return;
      }

      const state = core.getPaginationState(
        descriptors,
        windowObject.location.href,
        getDeclaredTotal(pagination)
      );
      const firstButton = startControls.querySelector(".ghpj-button--first");
      const lastButton = endControls.querySelector(".ghpj-button--last");
      const input = endControls.querySelector(".ghpj-input");

      endControls.dataset.lastPage = String(state.last);
      firstButton.disabled = state.current <= 1;
      lastButton.disabled = state.current >= state.last;
      input.max = String(state.last);
      input.placeholder = `1-${state.last}`;
    }

    /**
     * Creates or refreshes controls for one supported paginator.
     *
     * @param {Element} pagination The pagination root element.
     * @returns {void}
     */
    function enhance(pagination) {
      const adapter = getAdapter(pagination);
      const host = getHost(pagination);
      let startControls = host.querySelector(`:scope > .${CONTROL_CLASS}--start`);
      let endControls = host.querySelector(`:scope > .${CONTROL_CLASS}--end`);

      if (!startControls) {
        startControls = createStartControls(pagination);
        host.prepend(startControls);
      }

      if (!endControls) {
        endControls = createEndControls(pagination);
        host.append(endControls);
      }

      const outlineHover = usesLegacyStyle(pagination, adapter);
      startControls.classList.toggle(OUTLINE_CLASS, outlineHover);
      endControls.classList.toggle(OUTLINE_CLASS, outlineHover);
      pagination.classList.toggle(FIXED_CLASS, fixedEnabled);
      updateControls(pagination, startControls, endControls);
    }

    /**
     * Enhances every supported paginator currently in the document.
     *
     * @returns {void}
     */
    function scan() {
      documentObject.querySelectorAll(PAGINATION_SELECTOR).forEach(enhance);
    }

    /**
     * Coalesces repeated DOM updates into one animation-frame scan.
     *
     * @returns {void}
     */
    function scheduleScan() {
      if (scheduledFrame !== null) {
        return;
      }

      scheduledFrame = scheduleFrame(() => {
        scheduledFrame = null;
        scan();
      });
    }

    /**
     * Applies fixed mode to existing paginators and future enhancements.
     *
     * @param {boolean} enabled Whether fixed mode should be active.
     * @returns {void}
     */
    function setFixedMode(enabled) {
      fixedEnabled = Boolean(enabled);
      documentObject.querySelectorAll(PAGINATION_SELECTOR).forEach((pagination) => {
        pagination.classList.toggle(FIXED_CLASS, fixedEnabled);
      });
    }

    /**
     * Starts observing GitHub navigation and DOM changes.
     *
     * @returns {void}
     */
    function start() {
      if (started) {
        return;
      }

      started = true;
      observer = new MutationObserverClass(scheduleScan);
      observer.observe(documentObject.documentElement, { childList: true, subtree: true });

      // GitHub uses different events across its partial-navigation implementations.
      documentObject.addEventListener("turbo:load", scheduleScan);
      documentObject.addEventListener("pjax:end", scheduleScan);
      windowObject.addEventListener("popstate", scheduleScan);
      scheduleScan();
    }

    /**
     * Stops observation and cancels pending controller work.
     *
     * @returns {void}
     */
    function stop() {
      if (!started) {
        return;
      }

      started = false;
      observer.disconnect();
      observer = null;
      documentObject.removeEventListener("turbo:load", scheduleScan);
      documentObject.removeEventListener("pjax:end", scheduleScan);
      windowObject.removeEventListener("popstate", scheduleScan);

      if (scheduledFrame !== null) {
        cancelFrame(scheduledFrame);
        scheduledFrame = null;
      }
    }

    return Object.freeze({ scan, scheduleScan, setFixedMode, start, stop });
  }

  return {
    PAGINATION_ADAPTERS,
    PAGINATION_SELECTOR,
    createPaginationController
  };
});
