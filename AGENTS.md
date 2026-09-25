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

## 已有游戏的常规发布

- 优先使用 `npm run release:game -- <game-id>`；Codex 先核对游戏改动范围，未提交文件逐个用 `--file=相对路径` 列明。先执行 `--dry-run`，再执行正式发布。
- 常规发布由脚本完成非交互 Git 认证预检、游戏 test/typecheck/build、Git push、远端 SHA 校验、注册表更新、远端聚合验证、平台 push、生产版本等待与 smoke；HTTPS 与 SSH 均可，不要求用户手动操作终端、GitHub 或 EdgeOne，不索取 deployment ID。
- 涉及用户 GCM 凭据的 `git ls-remote`、`git push --dry-run`、`git push` 及 `release:game` 默认在正常登录用户上下文运行；本地 test/build/typecheck/validate 可在隔离环境运行。若首次预检失败，先诊断执行身份、profile 与 credential helper；`CREDENTIAL_CONTEXT_MISMATCH` 时 Codex 自动在正常用户上下文重跑同一发布命令，不询问用户，不要求管理员权限或交互凭据。Node 脚本不能自行切换 Windows 登录令牌，此重试由 Codex 执行工具选择上下文完成。
- 不为普通游戏更新改写 `docs/ACCEPTANCE.md`、`docs/DEPLOYMENT.md`、`docs/KPL_GAME_HANDOFF.md`；结果记录在忽略目录 `reports/release-latest.json`。
- 不得仅因 origin 使用 HTTPS 就要求用户配置 SSH、登录 GitHub 或运行终端命令。认证失败首先诊断执行上下文；只有正常用户上下文中的非交互 `git push --dry-run` 明确认证失败，才可返回 `AUTH_REQUIRED` 并要求重新认证。隔离上下文的 GCM 错误不能称为凭据失效；权限缺失、收费操作、破坏性数据操作或安全敏感操作按具体影响请用户介入。不得通过关闭安全设置或手动 EdgeOne 部署绕过失败。
