"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../src/core.js");

test("parses only positive integer page numbers", () => {
  assert.equal(core.parsePositiveInteger("40"), 40);
  assert.equal(core.parsePositiveInteger(" 2 "), 2);
  assert.equal(core.parsePositiveInteger("2.5"), null);
  assert.equal(core.parsePositiveInteger("0"), null);
  assert.equal(core.parsePositiveInteger("abc"), null);
});

test("reads page numbers from visible text and GitHub aria labels", () => {
  assert.equal(core.readPageNumber({ text: "7", ariaLabel: "Page 7..." }), 7);
  assert.equal(core.readPageNumber({ text: "…", ariaLabel: "Page 277" }), 277);
  assert.equal(core.readPageNumber({ text: "", ariaLabel: "第 12 页" }), 12);
});

test("detects Chinese page language for locale selection", () => {
  assert.equal(core.isChineseLanguage("zh-CN"), true);
  assert.equal(core.isChineseLanguage("ZH-tw"), true);
  assert.equal(core.isChineseLanguage("en"), false);
  assert.equal(core.isChineseLanguage(""), false);
  assert.equal(core.isChineseLanguage(null), false);
});

test("infers page parameter from native numeric links", () => {
  const links = [
    { page: 1, href: "/search?q=codex&p=1&type=repositories" },
    { page: 3, href: "/search?q=codex&p=3&type=repositories" }
  ];

  assert.equal(core.inferPageParam(links, "https://github.com/search?q=codex"), "p");
});

test("builds a page URL while preserving the native query", () => {
  const links = [
    { page: 1, href: "/openai/issues?q=is%3Aopen&page=1" },
    { page: 3, href: "/openai/issues?q=is%3Aopen&page=3" }
  ];
  const result = new URL(
    core.buildPageUrl(links, "https://github.com/openai/issues?q=is%3Aopen&page=2", 40)
  );

  assert.equal(result.pathname, "/openai/issues");
  assert.equal(result.searchParams.get("q"), "is:open");
  assert.equal(result.searchParams.get("page"), "40");
});

test("supports GitHub React pagination hash links", () => {
  const links = [
    { page: 1, href: "#1" },
    { page: 2, href: "#2", current: true },
    { page: 277, href: "#277" }
  ];
  const currentUrl = "https://github.com/orgs/microsoft/repositories?page=2";
  const state = core.getPaginationState(links, currentUrl);
  const result = new URL(core.buildPageUrl(links, currentUrl, 120));

  assert.deepEqual(state, { current: 2, last: 277, pageParam: "page" });
  assert.equal(result.searchParams.get("page"), "120");
  assert.equal(result.hash, "");
});

test("uses declared total pages when GitHub omits a distant last-page link", () => {
  const links = [
    { page: 4, href: "?page=4" },
    { page: 5, href: "?page=5", current: true },
    { page: 6, href: "?page=6" }
  ];

  assert.equal(
    core.getPaginationState(links, "https://github.com/openai/issues?page=5", "41").last,
    41
  );
});
