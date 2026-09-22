# KPL GAME 总交接

KPL GAME 是非官方粉丝自制的静态小游戏平台，正式域名计划为 `https://kplgame.cn`。玩家看到一个网站；开发维护多个独立游戏仓库。

| 仓库 | 职责 | 正式路径 |
| --- | --- | --- |
| KQ-KUN/kpl2k | 2K 游戏、canonical 数据生产与清洗 | /kpl2k/ |
| KQ-KUN/KPL-Guessing | Guessing 唯一正式业务源码、题库与独立构建 | /guessing/ |
| KQ-KUN/kplgame | Portal、规范、注册表、聚合构建、统一发布 | / |
| kpl-link / kpl-timeline / kpl-grid / kpl-draft / kpl-lineup | 后续独立游戏，未通过接入验收前禁用 | 对应子路径 |

开始新游戏前读 [数据交接](DATA_HANDOFF.md)、[UI 规范](UI_STANDARD.md)、[接入协议](GAME_INTEGRATION.md)，复制 `templates/NEW_GAME_AGENTS.md`，逐项执行 [新游戏清单](NEW_GAME_CHECKLIST.md)。禁止为了建新游戏重抓已有数据、假设名字等于人物 ID、修改其他游戏内部实现。

平台 Node.js 24；从注册表拉取源码：`npm run checkout`；安装游戏依赖：`npm run install:games`；`npm test`；`npm run build`。构建结果为 `dist/`，报告在 `reports/`。本地路径覆盖见接入协议。`npm run serve` 启动预览。

发布与回滚见 [部署说明](DEPLOYMENT.md)。GitHub 构建产物和线上部署分别验收，不自动购买资源或改变 DNS。当前 CloudBase 的旧目录和构建链保留；迁移状态见 [审计](AUDIT.md) 与 [验收报告](ACCEPTANCE.md)。

数据当前保留于 `kpl2k/data/`，不另拆 kpl-data；三个以上游戏大量独立依赖后再评估。平台不维护游戏大量业务源码，不采用 submodule、subtree、Nx、Turborepo、私有 npm 包。广告关闭，无账号系统。
