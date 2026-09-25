# Codex 发布流程

## LEVEL 1 ROUTINE RELEASE

已有游戏更新：在游戏仓库完成本次改动，核对工作区只含本次文件。进入 `kplgame` 后运行 `npm run release:game -- <game-id> --dry-run`，确认通过，再运行 `npm run release:game -- <game-id>`。有未提交的本次文件时，两个命令都逐个附加 `--file=游戏仓库相对路径`；脚本只暂存列明的文件，任何未列明改动都会中止。游戏已提前提交时不用 `--file`，脚本不会制造空提交。

脚本执行游戏 test、可用时的 typecheck、build，推送游戏 `main` 并查询远端 SHA；只更新该游戏的注册表 ref，再重新 checkout 公开仓库进行安装、测试、构建、校验。平台推送后等待 `https://kplgame.cn/release-meta.json` 的 `platformCommit` 等于刚推送的 SHA，再对首页、所有启用游戏入口及页面引用的本站 JS/CSS/JSON 做 HTTP 验收。结果写入本地忽略文件 `reports/release-latest.json`。`dist/release-meta.json` 每次构建自动生成，包含当前平台 HEAD 和所有启用游戏 ref；构建时间不参与版本判定。

正式发布要求存在可用、非交互、安全的 Git push 凭据，HTTPS 和 SSH 均可。脚本开头会对游戏与平台分别执行远端查询和 `git push --dry-run`，并禁用 Git、Git Credential Manager 与 SSH 的交互提示。现有 HTTPS 安全凭据可直接复用，不需要配置 SSH、Windows ssh-agent 或重新登录 GitHub。平台 CI 与 EdgeOne 的公开源码 checkout 始终走 HTTPS。`--dry-run` 会执行认证预检，但不提交、不真正推送、不等待生产；它使用游戏远端 `main` 的现有 SHA 做聚合验证。因此尚未推送的游戏改动，dry-run 的聚合阶段验证的是当前远端版；游戏本地 test/build 已验证本次改动。

认证失败首先诊断执行上下文；只有正常用户上下文中的非交互 `git push --dry-run` 也明确认证失败时，才把问题升级为 `AUTH_REQUIRED`。Codex 对 Git 网络步骤默认选择正常登录用户上下文，以复用该用户现有的 HTTPS/GCM 凭据；本地测试与构建仍可在隔离环境执行。若首次预检返回 `CREDENTIAL_CONTEXT_MISMATCH`，Codex 自动在正常用户上下文重跑同一发布命令，无需用户重新登录。脚本会检查 `whoami`、`USERPROFILE`、`HOME`、`HOMEDRIVE`、`HOMEPATH` 和 Git credential helper 的有效及 global 配置，只报告粗粒度的 transport、credentialProvider、executionContext，不输出凭据。Windows 仓库文件 owner 可能是隔离身份，因此不能单独据此判断正常用户。Node 进程不能自行切换 Windows 登录令牌；上下文切换须由 Codex 的命令执行环境完成。正常用户访问隔离创建的 checkout 如遇 Git `safe.directory` 检查，仅对本次命令设置精确目录的进程级安全例外，不修改全局配置。

常规更新只要求游戏测试/构建、自动发布链路及生产 smoke。无异常时不重新审核 DNS、SSL、CloudBase、域名和 EdgeOne 项目设置，不手动触发部署，不查询 deployment ID。文档里程碑文件不随每次小版本修改。

Git 网络请求设有有限超时；checkout 的每次 `git fetch` 最多等待 45 秒，短时网络故障或超时最多尝试 3 次，并输出游戏与尝试次数。超时归为 `REMOTE_TIMEOUT`，不代表凭据失效，也不要求重新登录。checkout 最终失败会清理本次创建且未产生工作树文件的半成品目录，使下次发布可直接重试；已有源码目录始终不会被覆盖或清理。

## LEVEL 2 NEW GAME

新游戏首次接入需要完整游戏接入验收、注册表与路径、UI/移动端、独立构建、聚合构建及生产 smoke。只有出现域名相关异常时才检查 DNS/域名。

## LEVEL 3 INFRASTRUCTURE

部署、域名或构建体系变化才进行完整平台验收；涉及收费、DNS、删除或安全敏感操作时遵循项目授权边界。

## 失败边界

任一认证预检、游戏测试、远端查询、聚合验证失败，脚本立即停止，不推送平台。`CREDENTIAL_CONTEXT_MISMATCH` 表示当前上下文无法访问现有凭据，Codex 应自动切正常用户重试，不向用户报“凭据失效”；`AUTH_REQUIRED` 只在正常用户 push 预检明确认证失败后表示需要重新认证；`REMOTE_UNREACHABLE` 会先自动重试，不误报为登录失效；`NO_PUSH_PERMISSION` 表示当前身份无写入权限。游戏 push 成功但平台失败时，游戏远端可能已经更新，平台仍保持旧 ref；报告中保留已完成阶段供修复后重试。平台 push 后若生产版本等待或 smoke 失败，状态为失败/待调查，不手动触发 EdgeOne 部署掩盖问题。GitHub Actions 对 `main` 的绿色结果同时要求构建通过、对应 SHA 已部署以及生产 smoke 通过；PR 只进行构建验证。
