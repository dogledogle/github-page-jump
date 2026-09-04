"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const manifest = require("../manifest.json");
const packageMetadata = require("../package.json");

test("keeps package and extension versions synchronized", () => {
  assert.equal(manifest.version, packageMetadata.version);
});

test("references only existing content-script assets", () => {
  for (const contentScript of manifest.content_scripts) {
    for (const asset of [...contentScript.css, ...contentScript.js]) {
      assert.equal(fs.existsSync(path.join(projectRoot, asset)), true, `${asset} is missing`);
    }
  }
});

test("loads shared modules before the content-script entry point", () => {
  assert.deepEqual(manifest.content_scripts[0].js, [
    "src/core.js",
    "src/shared.js",
    "src/pagination.js",
    "src/content.js"
  ]);
});
