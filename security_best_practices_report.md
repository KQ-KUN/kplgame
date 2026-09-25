# KPL GAME 静态站安全基线审计（2026-09-25）

范围：`KQ-KUN/kplgame`、`KQ-KUN/kpl2k`、`KQ-KUN/KPL-Guessing`、`KQ-KUN/kpl-link` 的当前正式站源码与聚合产物。审计了 HTML 插入和动态代码执行、URL/搜索/本地存储、已跟踪文件中的凭据和个人路径、运行时外链、锁文件、Actions 权限及响应头。以下位置采用“仓库/文件:行号”。

源码统计：2K 有 66 个 `innerHTML` 赋值，Link 有 5 个，Guessing 与 Portal 为 0；四个范围均未发现 `insertAdjacentHTML`、`eval`、`new Function`、`document.write` 或 `outerHTML` 赋值。保留的模板插入点以静态数据、数值或已转义文本为输入，生产构建逐文件检查外部运行资源。

## CRITICAL

未确认可由匿名访客直接触发的严重漏洞，也未在当前已跟踪文件中发现密钥或令牌字面量。此结论不等于历史提交或外部服务配置的完整秘密扫描。

## HIGH

**H-01：战绩卡 HTML 生成器未转义数据。** `kpl2k/tools/sim_engine.py:417-523` 曾把选手名、队名、对手、比分和头像 URL 直接拼进 HTML；恶意数据进入生成流程时可产生存储型 XSS。已逐项进行 HTML 属性和文本转义，替换使用 `outerHTML` 的头像错误处理；`kpl2k/tools/test_security_html.py:10-27` 用恶意标记验证输出。已交付的 `app/result_card.html` 示例也移除了 `outerHTML` 处理器。

## MEDIUM

**M-01：图鉴模板把数据 ID 放进内联 JavaScript。** `kpl2k/tools/build_player_library.py:413-476` 的旧模板使用 `onclick="toggleCard(this,'${esc(p.id)}')"`。HTML 实体进入事件处理器后会重新解码，HTML 转义不能保证 JavaScript 字符串安全。已改成 `data-player-id` 与事件委托，并以 `textContent` 创建头像错误兜底；生成的 `app/player_library.html` 同步更新。历史页 `tools/build_historical_archive.py:220-226` 也补齐属性和值转义并移除动态行内点击处理器。

**M-02：正式入口缺少浏览器安全头。** 审计时 `/`、`/kpl2k/`、`/guessing/`、`/link/` 均未返回 CSP、`nosniff`、Referrer-Policy、Permissions-Policy 或 HSTS。已在 `kplgame/edgeone.json:1-14` 配置全站响应头。CSP 限制脚本、连接和字体为本站，禁用对象与 iframe，仅给 2K 的静态战绩示例允许一个 HTTPS 图片源。2K 仍有内联脚本和事件处理器，因此 `script-src 'unsafe-inline'` 暂须保留；这降低 CSP 对脚本注入的防护强度。HSTS 仅设置 `max-age=86400`，未启用 `includeSubDomains` 或 preload。审计时 HTTP 首页以 302 跳至 HTTPS。

**M-03：生产 smoke 未拦截新加入的外部运行资源。** `kplgame/scripts/smoke-production.mjs:1-90` 原先只验证本站 JS/CSS/JSON 状态。已新增 `scripts/runtime-security.mjs`：检查未知第三方 script、iframe、非 HTTPS 运行资源、动态创建 script/iframe、各启用游戏的资源域名；本地 `validate` 扫描所有构建出的 HTML/CSS/JS，生产 smoke 检查入口与引用资源，并验证响应头。白名单见 `config/runtime-origins.json`，测试见 `tests/release.test.mjs`。

**M-04：Link 搜索结果的选手 ID 未作属性转义。** `kpl-link/src/main.ts:279-284` 曾将静态数据中的 `player.id` 直接插入 `data-player-id`。已使用既有 `escapeHtml`。搜索文本只用于筛选，显示的姓名与元数据已经转义；Guessing 的 URL hash 只选择受控状态或 ID，DOM 文本使用安全赋值；2K 分享参数解析为游戏 ID 与模式，本地存储的文本展示使用转义或 `textContent`。未发现 `eval`、`new Function`、`document.write` 或 `insertAdjacentHTML` 的生产源码调用。

**M-05：2K 本地存档中的计数值未经转义进入 `innerHTML`。** `kpl2k/app/js/ui.js:2026,2514,2594-2668` 的比赛比分、局数和 MVP 次数可从 `localStorage` 恢复，旧代码把其中部分值直接拼入 HTML。已在这些拼接点使用既有 `esc`；这消除被篡改的本机存档导致的自触发脚本注入。

## LOW

**L-01：个人本机路径已提交。** 2K 的本地启动批处理和 2K/Guessing 旧规划文档含个人绝对路径。已改为命令/仓库相对引用；启动脚本默认仅绑定 `127.0.0.1`，显式 `--lan` 才开放局域网。旧 Git 历史仍可包含原路径；清理历史需要重写提交，不属于本轮安全基线。

**L-02：Actions 引用原用可移动标签。** `kplgame/.github/workflows/build.yml:13-37` 已把 `actions/checkout`、`actions/setup-node` 与 `actions/upload-artifact` 锁定到核实过的 v4 完整提交 SHA。工作流已有顶层 `permissions: contents: read`，未发现游戏仓库自己的 Actions 工作流。三个游戏仓库均有已提交的 `package-lock.json`；平台无第三方 npm 依赖，聚合安装走 `npm ci`，不是 `npm install`。

**L-03：历史档案 JSON 含 20 个旧 HTTP 图片 URL。** `kpl2k/app/history_archive.html:18` 的内嵌档案数据保留原始来源 URL；当前渲染脚本不使用 `teamLogo` 加载图片，故不构成当前运行时混合内容。未来若展示队徽，必须先改为可用的 HTTPS 或本站图片并更新白名单。

## 运行依赖与验证边界

- 正式页面的运行时 JS/CSS/font 来自本站；2K 的静态战绩示例有 `smobatv-pic.tga.qq.com` 的 HTTPS 图片。B 站和小红书 URL 是用户点击后的导航。历史档案中另外两个图片域名仅作为未使用的数据值保留。
- `npm ci` 在 Guessing 和 Link 通过，npm 审计均报告 0 项漏洞；这是当前锁文件快照，不保证将来持续为 0。
- 本地三游戏聚合 `npm test`、`npm run build`、`npm run validate` 通过；带同一 CSP 的本地服务 smoke 覆盖四个入口、本站 JS/CSS/JSON 与响应头。浏览器自动化服务本次返回 `nodeRepl.fetch request failed`，所以实际游戏交互、控制台 CSP 违规和大陆网络仍需浏览器人工验收。
- EdgeOne `edgeone.json` 的仓库根目录与 `headers` 格式依据 [EdgeOne Makers 官方文档](https://pages.edgeone.ai/document/edgeone-json)。生产是否真正下发这些头，以发布后的 HTTP 响应和 production smoke 为准。
