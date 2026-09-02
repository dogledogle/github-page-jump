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

## 📄 许可证

[MIT](LICENSE)
