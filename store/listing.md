# Chrome Web Store 上架材料（GitHub Page Jump v1.2.9）

> 上传包：`dist/github-page-jump-1.2.9.zip`
> 以下文案可直接复制到 Chrome Web Store Developer Dashboard。

## 基本信息

| 字段 | 内容 |
|---|---|
| Name（≤45 字符） | GitHub Page Jump |
| Summary（≤132 字符） | Adds first-page, last-page, and direct page-jump controls to GitHub pagination. Works with light & dark themes. |
| Category | Developer Tools |
| Listing language | English（可另加 zh_CN） |
| Store icon | 包内 `icons/icon-128.png`（提交时在仪表盘单独再传一次 128×128） |
| Screenshots | `output/store/screenshot-light-1280x800.png`、`output/store/screenshot-dark-1280x800.png`（1280×800，合规） |

## Detailed description（英文，直接粘贴）

Adds first-page, last-page, and direct page-jump controls to every GitHub pagination.

FEATURES
• Jump to first page — the |< button on the left of the pagination.
• Jump to last page — the >| button right after Next.
• Direct page jump — type a page number and press Enter, or click the arrow inside the search-style box.

HIGHLIGHTS
• Works with GitHub's React pagination and legacy pagination.
• Understands both ?page= and ?p= URL parameters and preserves the rest of the query string.
• Correct last page even when distant page numbers are collapsed, using GitHub's declared total.
• Adapts automatically to light/dark themes via GitHub's own Primer design tokens.
• English and Chinese interface labels.
• Keyboard accessible (Enter to jump, visible focus states) and respects prefers-reduced-motion.

PRIVACY
• No permissions requested beyond github.com.
• No data collection, no tracking, no external requests.

Install, open any long GitHub list (issues, pull requests, search results, repositories), and jump straight to the page you need.

## Privacy practices（仪表盘 Privacy 标签页问答）

- **Single purpose**:
  Adds first-page, last-page, and direct page-jump controls to GitHub's pagination UI.

- **Permission justification（host permission: github.com content script）**:
  The content script needs access to github.com pages to locate the pagination component and inject the navigation controls into it. It reads only the pagination markup that is already part of the page. It does not read cookies, storage, or any other page data, and it does not transmit anything anywhere.

- **Data usage disclosures**: 全部选 **No**
  - Does this item collect or use personal data? → No
  - Does this item collect or use health data? → No
  - Does this item collect or use financial and payments information? → No
  - Does this item collect or use authentication information? → No
  - Does this item collect or use personal communications? → No
  - Does this item collect or use locally stored data? → No（不读取 cookie/localStorage）
  - Does this item collect or use web browsing activity? → No
  - Does this item collect or use website content? → No（仅读取分页 DOM 以注入控件，不外传）

- **Certifications**: 两个声明都勾选（不卖数据 / 不用数据做无关用途）。

## 提交步骤

1. 注册开发者账号：<https://chrome.google.com/webstore/devconsole>（需一次性 $5 注册费）。
2. Developer Dashboard → **New item** → 上传 `dist/github-page-jump-1.2.9.zip`。
3. **Store listing** 标签页：粘贴上面的 Name / Summary / Detailed description，上传 2 张截图 + 128×128 图标（`icons/icon-128.png`），类别选 Developer Tools，语言 English。
4. **Privacy tab**：按上面问答填写； 分布式标签页选 **Public**（或 Unlisted 仅凭链接访问）。
5. **Submit for review**。内容脚本扩展审核通常 1–3 个工作日，偶尔更久；通过后自动上架。

## 复核清单（提交前最后确认）

- [x] zip 内含 manifest.json / src / icons / LICENSE / README，路径为正斜杠
- [x] manifest 无权限申请（permissions 为空）、无远程代码
- [x] 图标 16/32/48/128 已在 manifest 声明且文件存在
- [ ] 上传前用浏览器重载一次 1.2.9 做最后冒烟（首末页跳转、输入跳转、暗色主题）
- [ ] Dashboard 提交
