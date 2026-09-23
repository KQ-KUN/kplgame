# 平台化整理验收（2026-09-22）

状态：`https://kplgame.cn` 已通过 EdgeOne 上线，CloudBase 旧站保留。2026-09-22 的平台化整理验收记录如下；生产状态更新见文末。

## 当前与职责

1. 原结构：app 游戏、data 数据、tools 数据与发布混合、guessing/link 子 workspace、portal 总站；真实根 build 已包含 Link，详见 [AUDIT](AUDIT.md)。
2. 混合职责：2K 仓库既生产数据，也开发多个游戏，并构建/发布总站。本轮新增独立平台仓库；旧副本继续作为兼容链保留。
3. Canonical：`KQ-KUN/kpl2k/data/`，重点 processed；未拆 kpl-data。
4. 12 个指定 processed 文件均已实读；职责与 schema 在 [DATA_HANDOFF](DATA_HANDOFF.md)，全量字段/空值/缺失/示例/哈希在 [DATA_SCHEMA_OBSERVED](DATA_SCHEMA_OBSERVED.md)。
5. 可复用关联：players.player_id、stats.player_id/season_id/team_franchise、seasons 的 season_id↔league_id、franchises.franchise_id；全部保留字符串。昵称、library.id@team、当前队名、赛季展示名不可替代实体主键；旧赛季命名需显式映射。
6. 实测数据：746 基础选手、701 展示档、32 赛季、3,290 统计行、3,374 归属行、732 本地头像。player_id 无重复；7 组同名；stats 无未知选手/赛季、无重复 player-season；1,423 条唯一昵称关联下 teams 与 attribution 队伍不一致；头像缓存指向文件均存在。冲突不是已确认的错误归属，不自动修正。归属生成器注释与实现不一致，见数据交接。

## 文档与仓库

7. 已创建 KPL_GAME_HANDOFF、UI_STANDARD、DATA_HANDOFF、GAME_INTEGRATION、DEPLOYMENT、NEW_GAME_CHECKLIST，另有根 AGENTS.md、模板 NEW_GAME_AGENTS.md、AUDIT、字段扫描与冲突证据。
8. 新 Codex 首读 [KPL_GAME_HANDOFF](KPL_GAME_HANDOFF.md)，再按链接读取专门规范。
9. kpl2k 目标职责：2K 游戏和当前成熟数据管线。现有 Hub 构建暂时兼容保留；本轮没有把旧根目录伪装成已经彻底拆完。
10. KPL-Guessing 是正式竞猜业务源；此次从独立远端拉取构建，不用 kpl2k/guessing 冒充独立仓库。
11. kplgame 负责注册、规范、Portal、聚合、验证与发布配置；不维护游戏业务源码，sources/dist/reports 均忽略。当前本地位于原工作区的 `kplgame/` 独立 Git 目录，可整体移到并列目录，不要把它作为父仓库 gitlink 提交。

## 构建与运行验收

12. 已统一生成 `dist/index.html`、`dist/kpl2k/index.html`、`dist/guessing/index.html`；validate-build 零断链。Link/Timeline/Grid/Draft/Lineup 注册为 disabled，不参与本轮发布。
13. 2K 为独立静态 app，平台直接收集；Guessing 的独立 npm ci、typecheck、build 和 9 项测试通过。两者无需启动 Hub 即可开发。
14. 总仓库使用配置化多仓库 checkout，锁定 2K `615ae9a87c0496d533e8a17f295405a4644364b3` 和 Guessing `8c66c50e9a8d6773b065489c1f74e13166cfed8e`；最终本地 build-manifest 两项 actualRef 均匹配，dirty=false。3 项平台测试通过；2K 引擎验证 29 赛季×3 seeds 通过。Windows 本地构建完成，GitHub Actions 用同一命令复验 Linux。

浏览器实际验证：

- Portal、2K 首页、Guessing 首页均测 320/390/768/1024/1366px，无文档横向溢出；Portal 390px 截图确认双卡片、公告和非官方声明可读。
- Guessing 390px：进入弗一把、搜索 Fly、ArrowDown/Enter 选中、提交后剩余 8→7 次且显示反馈、查看答案结束一局、刷新和返回 Hub。顶部与底部均为游戏中心。
- 2K 390px：玩家提示、经典模式、预设阵容、2026 夏季赛、模拟、跳转确认、最终战绩；结果表格在 overflow-x:auto 容器内滚动，文档未超出视口；返回 Hub 正常。
- 两游戏运行期间所检查控制台 error 为空。静态资源校验覆盖 HTML/CSS、字面量 fetch/import、本地 JSON 头像。没有穷举所有动态路径、全部游戏模式和所有异常分支。

15. UI 规范已固化；没有给旧游戏做全面视觉重写。原游戏仍有旧风格/部分小字号和对比度需逐步迁移，不能宣称整体完全符合新规范。
16. 手机主流程已验证，完整键盘可达性、所有 Modal 焦点恢复、系统 reduced-motion 实机切换未全量验收；新规范和发布清单明确要求。
17. 构建 HTML/CSS/JS 未发现禁用的 Google Fonts/jsDelivr/unpkg/cdnjs。数据中仍有腾讯远端图片与来源 URL，外链清单见 reports/build-report.json；未将来源引用全部误判为运行依赖。核心游戏逻辑不依赖境外 CDN，所有外部图片成功率尚未逐个实测。

## 性能

Portal 初始复制版首屏约 3.9 MB，主要来自两张原图。新首页使用约 600 字节的 SVG 文字标识，保留所有原 PNG；实际首页 HTML+CSS+图标总计 **13,295 bytes（约13 KB，未压缩）**，无首屏 JS，不预取游戏数据。公告页仍保留原大 favicon，属于后续可优化项。

| 产物 | JS bytes | CSS bytes | JSON bytes | Images bytes |
| --- | ---: | ---: | ---: | ---: |
| KPL 2K | 278981 | 51357 | 4090576 | 9211378 |
| Guessing | 35111 | 44542 | 1527296 | 2624152 |

这些是完整产物累计，不等于首页下载。2K 多个 m4a 为 2–3.5 MB，最大是明日坐标 3,503,348 bytes；原品牌 PNG 为 2,140,068 / 1,736,997 bytes。每次构建输出最大10资源及分类统计；没有因文件大而删除原资产。

## 部署与清理

18. CloudBase `https://kpl2k-kpl2k-d0gigrx6e89914f65.webapps.tcloudbase.com` 的 `/`、`/kpl2k/`、`/guessing/` 实测 HTTP 200，分别返回总站、2K、Guessing 标题。未更改部署设置、旧源码或推送旧仓库；HTTP 验证不等于全量线上玩法复测。
19. 2026-09-23 已将 `kplgame.cn` 接入 EdgeOne Makers 生产环境；当前配置和上线证据见下方及 [DEPLOYMENT](DEPLOYMENT.md)。
20. 未购买服务器、数据库、CDN、SSL 或其他收费资源；GitHub Actions 与托管的实际免费额度由账户/提供商当前规则决定，本轮未购买额度。
21. 没有旧关键源码获准删除。dist 可重建，但不需要为目录整洁主动删除；tmp 中本轮 clone/cache 可由用户确认后清理。
22. 原 portal、guessing、link、数据、根构建和小工具全部保留。尤其 tools/player_icons.py 仍依赖 guessing/public；新正式站验收与该依赖解耦之前，不删除兼容副本。

## 生产上线状态（2026-09-23）

- EdgeOne 项目 `kplgame2` 位于全球可用区（不含中国大陆），关联 `KQ-KUN/kplgame` 的 `main`。手动触发的生产部署 `dp9t0ryh5rc9` 成功；构建日志确认 Node.js 24.18.0、`npm run checkout && npm run install:games`、`npm test && npm run build`、`dist` 产物校验与上传均完成，校验错误数为 0。
- EdgeOne 域名管理显示 `kplgame.cn` 已生效，CNAME 目标为 `kplgame.cn.pages.dnsoe5.com`；免费 HTTPS 证书已部署。`http://kplgame.cn/` 实测 302 跳转 `https://kplgame.cn/`，HTTPS 证书校验通过。
- 正式域名 `/`、`/kpl2k/`、`/guessing/` 均实测 HTTP 200，返回对应页面标题。EdgeOne 临时部署的首页、2K 入口和返回总站已在浏览器操作；2K 子路径刷新复测通过，曾有一次刷新只显示导航、再次刷新恢复。Guessing 浏览器刷新及正式域名资源逐项检查未在当次验收中完成。
- CloudBase 兼容地址的 `/`、`/kpl2k/`、`/guessing/` 上线后复查均返回 HTTP 200；未删除或改动旧站。
- Git push 自动发布链路已实测通过：`main` 推送 `1f88e49acf020fd7b42daf03332d7a567059080d` 后，EdgeOne 自动创建生产部署 `dpl4alv1w4l0` 并显示成功。构建日志确认 `npm test && npm run build` 通过（平台测试 3/3、Guessing 测试 9/9、构建校验错误数 0）；部署后正式域名 `/`、`/kpl2k/`、`/guessing/` 再次返回 HTTP 200。
- 中国大陆电信、联通、移动普通网络的真实可用性与体验仍为 **MANUAL ACCEPTANCE PENDING**；不能以当前运行环境的公网检查代替。

## KPL Link 接入验收（2026-09-23，平台待发布）

- Link 独立公开仓库为 `KQ-KUN/kpl-link`，生产分支 `main`；已推送并锁定完整 SHA `c45134534ab61431263ea5ad7ac5a15bc9fc2f8d`，远端 `refs/heads/main` 与本地一致。
- Link 独立 `npm ci`、13 项测试、TypeScript 检查及 Vite build 通过；输出入口 `dist/index.html`，`base: './'`。730 张头像与选手/图谱 JSON 作为 Link 自有静态快照，未依赖 `/kpl2k/` 私有资源。
- 在新的平台克隆中从 GitHub 执行 `npm run checkout`，三个实际 ref 均与注册表一致且工作区干净；`npm run install:games`、平台 3 项测试、2K 引擎验证、Guessing 9 项、Link 13 项、聚合 build 和单独 validate 全部通过。`dist/index.html`、`dist/kpl2k/index.html`、`dist/guessing/index.html`、`dist/link/index.html` 均存在，校验错误 0。
- 本地浏览器 390/768/1366px 检查 Portal 三张卡、Link 直接访问与刷新，均无文档横向溢出；Link 完成全员搜索、断链查看答案、加入正确中间选手并获得最短路径、返回 `/` 的流程。Portal 初始请求未预载游戏数据；2K 与 Guessing 子路径本地直达和刷新为 200。
- 平台 `main` 推送、EdgeOne 新部署 ID、生产 `/link/` 玩法及大陆运营商网络验收仍待后续步骤；本轮未购买任何服务、未修改 EdgeOne 或 DNS。
