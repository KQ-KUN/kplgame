# KPL GAME 平台规则

先阅读 [总交接](docs/KPL_GAME_HANDOFF.md)。

- 每个游戏独立 GitHub 仓库；本站只维护 Portal、注册表、规范、聚合构建与发布，不收容游戏业务源码。
- `KQ-KUN/kpl2k/data/` 是当前 canonical data；优先复用，禁止重复抓已有数据、随意改写 canonical data。游戏在构建期生成自己的快照，浏览器不能依赖其他游戏私有目录。
- UI 遵守 [UI_STANDARD](docs/UI_STANDARD.md)，必须支持移动端、键盘及 reduced-motion。
- 中国大陆访问稳定性优先；核心运行资源自托管，禁止依赖境外运行时 CDN。
- 游戏必须独立 build；优先纯静态、现有工具和简单脚本，不引入不必要框架、共享组件包、用户系统或广告 SDK。
- 禁止擅自购买云服务、更改 DNS、删除历史数据或破坏现有 CloudBase 部署。
- `sources/`、`dist/`、`reports/` 是忽略目录。不得提交凭据、本地路径、环境文件或游戏源码副本。
- 注册表启用项必须构建和测试通过；发布前验证子路径、资源、移动交互及线上入口。构建成功不等于部署成功。
- 旧 `portal/`、`guessing/` 的删除须在新站验收后另行决定。本轮不开发 Link。
