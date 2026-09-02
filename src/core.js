(function initializeCore(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.GitHubPageJumpCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCore() {
  "use strict";

  const PAGE_PARAM_CANDIDATES = ["page", "p"];

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

  function readPageNumber(item) {
    const textPage = parsePositiveInteger(item.text || "");
    if (textPage) {
      return textPage;
    }

    const ariaLabel = item.ariaLabel || "";
    const match = ariaLabel.match(/(?:page|第)\s*(\d+)/i);
    return match ? parsePositiveInteger(match[1]) : null;
  }

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

  function findMatchingParam(url, page) {
    for (const [key, value] of url.searchParams.entries()) {
      if (parsePositiveInteger(value) === page) {
        return key;
      }
    }

    return null;
  }

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
    buildPageUrl,
    getPaginationState,
    inferPageParam,
    parsePositiveInteger,
    readPageNumber
  };
});
