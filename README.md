# KPL GAME

非官方粉丝自制小游戏平台。正式玩家入口为 https://kplgame.cn；每个游戏独立仓库，本仓库维护 Portal、规范、注册表、聚合构建与统一发布。

先读 [总交接](docs/KPL_GAME_HANDOFF.md)。开发接入见 [GAME_INTEGRATION](docs/GAME_INTEGRATION.md)，部署见 [DEPLOYMENT](docs/DEPLOYMENT.md)，当前实际状态见 [ACCEPTANCE](docs/ACCEPTANCE.md)。

游戏更新、首发、发布失败恢复与回滚统一遵守 [发布执行规范](docs/RELEASE_PROTOCOL.md)；现行发布命令与自动化实现边界见 [CODEX_RELEASE](docs/CODEX_RELEASE.md)。

需要 Node.js 24、npm、Git：

```sh
npm run checkout
npm run install:games
npm test
npm run build
npm run serve
```

输出 dist/，报告 reports/。不提交游戏源码或构建产物。canonical 数据保留在 KQ-KUN/kpl2k/data/。
