/**
 * @typedef {Object} PageDescriptor
 * @property {boolean} [current] Whether the descriptor represents the active page.
 * @property {string} [href] The native pagination link target.
 * @property {number} page The positive page number represented by the item.
 */

/**
 * @typedef {Object} PaginationState
 * @property {number} current The active page number.
 * @property {number} last The highest known page number.
 * @property {string} pageParam The query parameter used for pagination.
 */

/**
 * Publishes the environment-independent pagination helpers.
 *
 * @param {object} root The global object that receives the browser API.
 * @param {() => object} factory Creates the core API.
 * @returns {void}
 */
(function initializeCore(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.GitHubPageJumpCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, /**
 * Creates the core pagination API.
 *
 * @returns {object} The public core API.
 */
function createCore() {
  "use strict";

  const PAGE_PARAM_CANDIDATES = Object.freeze(["page", "p"]);

  /**
   * Converts a supported value to a positive safe integer.
   *
   * @param {number|string} value The candidate page number.
   * @returns {number|null} The parsed integer, or null when invalid.
   */
  function parsePositiveInteger(value) {
    if (typeof value === "number") {
      return Number.isSafeInteger(value) && value > 0 ? value : null;
    }

    if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
      return null;
    }

    const number = Number(value.trim());
    return Number.isSafeInteger(number) && number > 0 ? number : null;
  }

  /**
   * Reads a page number from visible text or a GitHub accessibility label.
   *
   * @param {{ariaLabel?: string, text?: string}} [item={}] The pagination item data.
   * @returns {number|null} The detected page number, or null when unavailable.
   */
  function readPageNumber(item = {}) {
    const textPage = parsePositiveInteger(item.text || "");
    if (textPage) {
      return textPage;
    }

    const ariaLabel = item.ariaLabel || "";
    const match = ariaLabel.match(/(?:page|第)\s*(\d+)/i);
    return match ? parsePositiveInteger(match[1]) : null;
  }

  /**
   * Resolves a link against the current page without throwing for malformed input.
   *
   * @param {string} href The link to resolve.
   * @param {string} currentUrl The current absolute page URL.
   * @returns {URL|null} The resolved URL, or null when resolution fails.
   */
  function toUrl(href, currentUrl) {
    if (!href) {
      return null;
    }

    try {
      return new URL(href, currentUrl);
    } catch (_error) {
      return null;
    }
  }

  /**
   * Finds a supported query parameter whose value matches a page number.
   *
   * @param {URL} url The URL to inspect.
   * @param {number} page The expected page number.
   * @returns {string|null} The matching parameter name, or null when absent.
   */
  function findMatchingParam(url, page) {
    for (const key of PAGE_PARAM_CANDIDATES) {
      const value = url.searchParams.get(key);
      if (parsePositiveInteger(value) === page) {
        return key;
      }
    }

    return null;
  }

  /**
   * Determines the pagination query parameter from the current URL and native links.
   *
   * @param {PageDescriptor[]} descriptors The available native pagination items.
   * @param {string} currentUrl The current absolute page URL.
   * @returns {string} The detected parameter name, defaulting to "page".
   */
  function inferPageParam(descriptors, currentUrl) {
    const current = new URL(currentUrl);

    for (const key of PAGE_PARAM_CANDIDATES) {
      if (parsePositiveInteger(current.searchParams.get(key))) {
        return key;
      }
    }

    for (const descriptor of descriptors) {
      const url = toUrl(descriptor.href, currentUrl);
      const key = url && findMatchingParam(url, descriptor.page);
      if (key) {
        return key;
      }
    }

    return "page";
  }

  /**
   * Derives the current page, last page, and query parameter for a paginator.
   *
   * @param {PageDescriptor[]} descriptors The available native pagination items.
   * @param {string} currentUrl The current absolute page URL.
   * @param {number|string|null|undefined} declaredTotal A total supplied by GitHub markup.
   * @returns {PaginationState} The normalized pagination state.
   */
  function getPaginationState(descriptors, currentUrl, declaredTotal) {
    const pages = descriptors.map((item) => item.page).filter(Boolean);
    const currentDescriptor = descriptors.find((item) => item.current);
    const url = new URL(currentUrl);
    const pageParam = inferPageParam(descriptors, currentUrl);
    const urlPage = parsePositiveInteger(url.searchParams.get(pageParam));
    const current = currentDescriptor ? currentDescriptor.page : urlPage || 1;
    const total = parsePositiveInteger(declaredTotal);
    const last = Math.max(total || 1, current, ...pages);

    return { current, last, pageParam };
  }

  /**
   * Builds a page URL from GitHub's native link shape while preserving its query.
   *
   * @param {PageDescriptor[]} descriptors The available native pagination items.
   * @param {string} currentUrl The current absolute page URL.
   * @param {number|string} targetPage The destination page number.
   * @returns {string} The absolute destination URL.
   * @throws {TypeError} When targetPage is not a positive integer.
   */
  function buildPageUrl(descriptors, currentUrl, targetPage) {
    const target = parsePositiveInteger(targetPage);
    if (!target) {
      throw new TypeError("targetPage must be a positive integer");
    }

    const pageParam = inferPageParam(descriptors, currentUrl);
    const template = descriptors.find((descriptor) => {
      const url = toUrl(descriptor.href, currentUrl);
      return url && findMatchingParam(url, descriptor.page) === pageParam;
    });
    const url = toUrl(template && template.href, currentUrl) || new URL(currentUrl);

    url.searchParams.set(pageParam, String(target));
    if (/^#\d+$/.test(url.hash)) {
      url.hash = "";
    }

    return url.href;
  }

  return {
    PAGE_PARAM_CANDIDATES,
    buildPageUrl,
    getPaginationState,
    inferPageParam,
    parsePositiveInteger,
    readPageNumber
  };
});
