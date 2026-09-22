# 新游戏开发规则

先阅读 KQ-KUN/kplgame 的 `docs/KPL_GAME_HANDOFF.md`、`DATA_HANDOFF.md`、`UI_STANDARD.md`、`GAME_INTEGRATION.md` 与 `NEW_GAME_CHECKLIST.md`。

- 本仓库只维护一个游戏，独立 dev/build/test；静态输出 dist，支持注册表子路径。
- 复用 kpl2k canonical 数据，在构建期用显式 `--source` 路径生成 public/data 快照，记录源 commit、schema、生成时间和覆盖范围。不重复抓已有数据，不改 canonical。
- 不在浏览器 fetch 其他游戏内部数据；资源本地打包，不依赖境外运行时 CDN。
- 遵循 UI 规范，移动端、键盘、focus-visible、reduced-motion 必须验收；提供返回游戏中心。
- 不擅自引入框架、账号系统、广告 SDK、云数据库、付费服务或修改 DNS。
- 通过独立测试和聚合子路径验收后才在 games.json 启用；报告真实验证和限制。
