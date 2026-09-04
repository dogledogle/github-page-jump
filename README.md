# ⏭️ GitHub Page Jump

A zero-build Chrome Manifest V3 extension that adds to GitHub's numeric pagination:

- ⏮️ Jump-to-first-page button
- 🔢 Type a page number and press Enter to jump
- ⏭️ Jump-to-last-page button
- 📌 Click the toolbar icon to toggle "Fixed pagination", which pins the paginator to the bottom of the viewport (off by default)

🎨 Controls use GitHub's Primer color variables, automatically adapting to GitHub's light, dark, and high-contrast themes, and support GitHub's partial page navigation.

## 📦 Install

1. Open `chrome://extensions/` in Chrome.
2. Enable "Developer mode" in the top-right corner.
3. Click "Load unpacked".
4. Select the cloned folder (the one containing `manifest.json`).
5. Open or refresh any GitHub page with numeric pagination.

🔒 The extension only runs on `https://github.com/*`, uses the `storage` permission solely to remember your preferences, and never collects or sends data.

## 🛠️ Development

The extension has no runtime dependencies and no build step. Run the full test suite with:

```sh
npm test
```

The source is split by responsibility:

- `src/core.js` contains pure pagination and URL logic.
- `src/shared.js` owns localization, setting definitions, and the Chrome Storage adapter.
- `src/pagination.js` adapts GitHub pagination markup and manages injected controls.
- `src/content.js` and `src/popup.js` are thin entry points.

Add support for new GitHub markup through `PAGINATION_ADAPTERS`. Register new preferences once in `SETTING_DEFINITIONS`, then consume them through the shared settings store. Keep `manifest.json` and `tests/fixture.html` script order aligned when adding a source module.

### Releases

Keep the versions in `package.json` and `manifest.json` identical. When a commit that changes `package.json#version` reaches `main`, GitHub Actions runs the tests, packages the extension, creates a `v<version>` tag, and publishes a GitHub Release with the ZIP attached. Changes to other `package.json` fields do not create a release.

## 📄 License

[MIT](LICENSE)

---

## 🇨🇳 中文

一个无需构建步骤的 Chrome Manifest V3 扩展，为 GitHub 数字分页器增加：

- ⏮️ 跳转到第一页按钮
- 🔢 输入页码并按回车跳转
- ⏭️ 跳转到最后一页按钮
- 📌 点击工具栏图标可开关“固定分页器”，开启后分页器悬浮固定在视口底部（默认关闭）

🎨 控件使用 GitHub 的 Primer 颜色变量，自动适配 GitHub 的亮色、暗色与高对比度主题，并支持 GitHub 的局部页面导航。

## 📦 安装

1. 打开 Chrome 的 `chrome://extensions/`。
2. 打开右上角的“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择克隆下来的项目文件夹（即包含 `manifest.json` 的目录）。
5. 打开或刷新任意带数字分页器的 GitHub 页面。

🔒 扩展只在 `https://github.com/*` 中运行，`storage` 权限仅用于记住你的偏好设置，不会收集或发送数据。

## 🛠️ 开发

扩展没有运行时依赖，也不需要构建。运行完整测试：

```sh
npm test
```

源码按职责拆分：`core.js` 负责纯分页逻辑，`shared.js` 负责本地化与设置存储，`pagination.js` 负责适配 GitHub DOM 和控件生命周期，`content.js`、`popup.js` 只负责启动与绑定。

支持新的 GitHub 分页结构时扩展 `PAGINATION_ADAPTERS`；增加偏好设置时先在 `SETTING_DEFINITIONS` 中注册，再通过共享设置存储访问。新增源码模块后，需要同步 `manifest.json` 与 `tests/fixture.html` 中的脚本顺序。

### 发布

`package.json` 与 `manifest.json` 中的版本号必须保持一致。当修改 `package.json#version` 的提交进入 `main` 后，GitHub Actions 会运行测试、打包扩展、创建 `v<版本号>` tag，并发布附带 ZIP 的 GitHub Release。修改 `package.json` 的其他字段不会触发发布。

## 📄 许可证

[MIT](LICENSE)
