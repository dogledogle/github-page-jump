# GitHub Page Jump

一个无需构建步骤的 Chrome Manifest V3 扩展，为 GitHub 数字分页器增加：

- 跳转到第一页按钮
- 输入页码并按回车跳转
- 跳转到最后一页按钮

控件使用 GitHub 的 Primer 颜色变量，自动适配 GitHub 的亮色、暗色与高对比度主题，并支持 GitHub 的局部页面导航。

## 安装

1. 打开 Chrome 的 `chrome://extensions/`。
2. 打开右上角的“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本项目目录 `GitHubPageJump`。
5. 打开或刷新任意带数字分页器的 GitHub 页面。

扩展只在 `https://github.com/*` 中运行，不申请额外权限，也不会收集或发送数据。

## 使用

- 点击分页器最左侧（Previous 左边）带竖线的箭头跳转到第一页。
- 在输入框输入 `1` 到最后一页之间的整数，按回车或点击框内右侧的箭头按钮跳转。
- 点击 Next 右侧带竖线的箭头跳转到最后一页。

## 测试

需要 Node.js 18 或更高版本：

```powershell
npm test
```

用于视觉检查的静态页面位于 `tests/fixture.html`。

## 许可证

[MIT](LICENSE)
