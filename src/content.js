(function initializePageJump() {
  "use strict";

  const core = globalThis.GitHubPageJumpCore;
  if (!core) {
    return;
  }

  const PAGINATION_SELECTOR = [
    'nav[data-component="Pagination"]',
    'nav[aria-label="Pagination"]',
    ".paginate-container"
  ].join(",");
  const CONTROL_CLASS = "ghpj-controls";
  const OUTLINE_CLASS = "ghpj-controls--outline";
  // 旧版 .pagination（PR 列表等 Rails 页面）的原生按钮 hover 只显示描边，React 版（issue 列表）则是背景填充
  const LEGACY_PAGINATION_SELECTOR =
    ".paginate-container, .pagination, .previous_page, .next_page";
  const STORAGE_KEY = "fixedPagination";
  const FIXED_CLASS = "ghpj-pagination--fixed";
  const storageApi =
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync
      ? chrome.storage.sync
      : null;
  let fixedEnabled = false;
  // 与弹窗一致，统一按浏览器界面语言选择文案（GitHub 自身的页面语言信号不可靠）
  const uiLanguage =
    typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getUILanguage
      ? chrome.i18n.getUILanguage()
      : navigator.language || "";
  const locale = core.isChineseLanguage(uiLanguage)
    ? {
        first: "跳转到第一页",
        last: "跳转到最后一页",
        jump: "跳转到输入的页码",
        input: "输入页码后按回车跳转",
        invalid: (last) => `请输入 1 到 ${last} 之间的整数`
      }
    : {
        first: "Go to first page",
        last: "Go to last page",
        jump: "Jump to page",
        input: "Enter a page number and press Enter",
        invalid: (last) => `Enter a whole number from 1 to ${last}`
      };

  const ICONS = {
    first:
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.75 3a.75.75 0 0 1 .75.75v8a.75.75 0 0 1-1.5 0V3.75a.75.75 0 0 1 .75-.75Zm8.03 9.78a.75.75 0 0 1-1.06 0L6.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L8.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z"/></svg>',
    last:
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.25 3A.75.75 0 0 1 13 3.75v8a.75.75 0 0 1-1.5 0V3.75a.75.75 0 0 1 .75-.75Zm-8.03 9.78a.75.75 0 0 0 1.06 0L9.53 8.53a.75.75 0 0 0 0-1.06l-4.25-4.25a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L7.94 8l-3.72 3.72a.75.75 0 0 0 0 1.06Z"/></svg>',
    jump:
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H1.75a.75.75 0 0 1 0-1.5h9.44L8.22 4.03a.75.75 0 0 1 0-1.06Z"/></svg>'
  };

  function pageNumberForElement(element) {
    return core.readPageNumber({
      ariaLabel: element.getAttribute("aria-label") || "",
      text: element.textContent.trim()
    });
  }

  function collectDescriptors(pagination) {
    return Array.from(pagination.querySelectorAll("a, span, em"))
      .map((element) => ({
        current:
          element.getAttribute("aria-current") === "page" ||
          element.classList.contains("current"),
        element,
        href: element.getAttribute("href") || "",
        page: pageNumberForElement(element)
      }))
      .filter((descriptor) => descriptor.page);
  }

  function getDeclaredTotal(pagination) {
    const element = pagination.querySelector("[data-total-pages]");
    return element ? element.getAttribute("data-total-pages") : null;
  }

  function getHost(pagination) {
    return (
      pagination.querySelector("[data-hidden-viewport-ranges]") ||
      pagination.querySelector(":scope > .pagination") ||
      pagination
    );
  }

  function usesLegacyHoverStyle(pagination) {
    return Boolean(
      pagination.matches(LEGACY_PAGINATION_SELECTOR) ||
        pagination.querySelector(LEGACY_PAGINATION_SELECTOR)
    );
  }

  function createIconButton(kind, label, className = `ghpj-button ghpj-button--${kind}`) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = ICONS[kind];
    return button;
  }

  function findExactLink(descriptors, page) {
    const descriptor = descriptors.find(
      (item) => item.page === page && item.element.matches("a[href]")
    );
    return descriptor ? descriptor.element : null;
  }

  function navigate(pagination, page) {
    const descriptors = collectDescriptors(pagination);
    const exactLink = findExactLink(descriptors, page);

    if (exactLink) {
      exactLink.click();
      return;
    }

    window.location.assign(core.buildPageUrl(descriptors, window.location.href, page));
  }

  function setValidity(input, message) {
    input.setCustomValidity(message);
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function updateControls(pagination, startControls, endControls) {
    const descriptors = collectDescriptors(pagination);
    if (descriptors.length === 0) {
      startControls.remove();
      endControls.remove();
      return;
    }

    const state = core.getPaginationState(
      descriptors,
      window.location.href,
      getDeclaredTotal(pagination)
    );

    endControls.dataset.lastPage = String(state.last);
    startControls.querySelector(".ghpj-button--first").disabled = state.current <= 1;
    endControls.querySelector(".ghpj-button--last").disabled = state.current >= state.last;

    const input = endControls.querySelector(".ghpj-input");
    input.max = String(state.last);
    input.placeholder = `1-${state.last}`;
  }

  function createStartControls(pagination) {
    const controls = document.createElement("div");
    controls.className = `${CONTROL_CLASS} ${CONTROL_CLASS}--start`;

    const firstButton = createIconButton("first", locale.first);
    firstButton.addEventListener("click", () => navigate(pagination, 1));
    controls.append(firstButton);
    return controls;
  }

  function createEndControls(pagination) {
    const controls = document.createElement("div");
    controls.className = `${CONTROL_CLASS} ${CONTROL_CLASS}--end`;
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Page jump");

    const input = document.createElement("input");
    input.className = "ghpj-input";
    input.type = "text";
    input.inputMode = "numeric";
    input.pattern = "[0-9]*";
    input.autocomplete = "off";
    input.setAttribute("aria-label", locale.input);
    input.title = locale.input;

    const jumpButton = createIconButton("jump", locale.jump, "ghpj-jumpbox-button");
    const lastButton = createIconButton("last", locale.last);

    const submitInput = () => {
      const page = core.parsePositiveInteger(input.value);
      const lastPage = Number(controls.dataset.lastPage);

      if (!page || page > lastPage) {
        setValidity(input, locale.invalid(lastPage));
        input.reportValidity();
        return;
      }

      setValidity(input, "");
      navigate(pagination, page);
    };

    jumpButton.addEventListener("click", submitInput);
    lastButton.addEventListener("click", () => {
      navigate(pagination, Number(controls.dataset.lastPage));
    });
    input.addEventListener("input", () => setValidity(input, ""));
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      submitInput();
    });

    const jumpbox = document.createElement("div");
    jumpbox.className = "ghpj-jumpbox";
    jumpbox.append(input, jumpButton);

    controls.append(lastButton, jumpbox);
    return controls;
  }

  function enhancePagination(pagination) {
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

    const outlineHover = usesLegacyHoverStyle(pagination);
    startControls.classList.toggle(OUTLINE_CLASS, outlineHover);
    endControls.classList.toggle(OUTLINE_CLASS, outlineHover);

    pagination.classList.toggle(FIXED_CLASS, fixedEnabled);
    updateControls(pagination, startControls, endControls);
  }

  function applyFixedMode(enabled) {
    fixedEnabled = enabled;
    document.querySelectorAll(PAGINATION_SELECTOR).forEach((pagination) => {
      pagination.classList.toggle(FIXED_CLASS, enabled);
    });
  }

  if (storageApi) {
    storageApi.get({ [STORAGE_KEY]: false }, (result) => {
      if (!chrome.runtime.lastError) {
        applyFixedMode(Boolean(result[STORAGE_KEY]));
      }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" && changes[STORAGE_KEY]) {
        applyFixedMode(Boolean(changes[STORAGE_KEY].newValue));
      }
    });
  }

  let scanScheduled = false;
  function scheduleScan() {
    if (scanScheduled) {
      return;
    }

    scanScheduled = true;
    requestAnimationFrame(() => {
      scanScheduled = false;
      document.querySelectorAll(PAGINATION_SELECTOR).forEach(enhancePagination);
    });
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("turbo:load", scheduleScan);
  document.addEventListener("pjax:end", scheduleScan);
  window.addEventListener("popstate", scheduleScan);
  scheduleScan();
})();
