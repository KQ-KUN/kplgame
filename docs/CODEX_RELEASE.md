# Codex 发布流程

## LEVEL 1 ROUTINE RELEASE

已有游戏更新：在游戏仓库完成本次改动，核对工作区只含本次文件。进入 `kplgame` 后运行 `npm run release:game -- <game-id> --dry-run`，确认通过，再运行 `npm run release:game -- <game-id>`。有未提交的本次文件时，两个命令都逐个附加 `--file=游戏仓库相对路径`；脚本只暂存列明的文件，任何未列明改动都会中止。游戏已提前提交时不用 `--file`，脚本不会制造空提交。

脚本执行游戏 test、可用时的 typecheck、build，推送游戏 `main` 并查询远端 SHA；只更新该游戏的注册表 ref，再重新 checkout 公开仓库进行安装、测试、构建、校验。平台推送后等待 `https://kplgame.cn/release-meta.json` 的 `platformCommit` 等于刚推送的 SHA，再对首页、所有启用游戏入口及页面引用的本站 JS/CSS/JSON 做 HTTP 验收。结果写入本地忽略文件 `reports/release-latest.json`。`dist/release-meta.json` 每次构建自动生成，包含当前平台 HEAD 和所有启用游戏 ref；构建时间不参与版本判定。

正式推送要求游戏和平台的 `origin` push URL 为 `git@github.com:KQ-KUN/<repo>.git`，fetch URL 可继续使用 HTTPS。平台 CI 与 EdgeOne 的公开源码 checkout 始终走 HTTPS。SSH 凭据失效时应修复凭据，不能改为不安全传输或要求用户执行日常命令。`--dry-run` 不提交、不推送、不等待生产；它使用游戏远端 `main` 的现有 SHA 做聚合验证。因此尚未推送的游戏改动，dry-run 的聚合阶段验证的是当前远端版；游戏本地 test/build 已验证本次改动。

常规更新只要求游戏测试/构建、自动发布链路及生产 smoke。无异常时不重新审核 DNS、SSL、CloudBase、域名和 EdgeOne 项目设置，不手动触发部署，不查询 deployment ID。文档里程碑文件不随每次小版本修改。

## LEVEL 2 NEW GAME

新游戏首次接入需要完整游戏接入验收、注册表与路径、UI/移动端、独立构建、聚合构建及生产 smoke。只有出现域名相关异常时才检查 DNS/域名。

## LEVEL 3 INFRASTRUCTURE

部署、域名或构建体系变化才进行完整平台验收；涉及收费、DNS、删除或安全敏感操作时遵循项目授权边界。

## 失败边界

任一游戏测试、远端查询、聚合验证失败，脚本立即停止，不推送平台。游戏 push 成功但平台失败时，游戏远端可能已经更新，平台仍保持旧 ref；报告中保留已完成阶段供修复后重试。平台 push 后若生产版本等待或 smoke 失败，状态为失败/待调查，不手动触发 EdgeOne 部署掩盖问题。GitHub Actions 对 `main` 的绿色结果同时要求构建通过、对应 SHA 已部署以及生产 smoke 通过；PR 只进行构建验证。
