# 发布与回滚

生产入口为 `https://kplgame.cn`；CloudBase 长网址保留为兼容/备用站。不购买收费产品、不改变 CloudBase 设置，也不推送旧 kpl2k main 触发它的旧自动部署。

## 当前生产配置（2026-09-23）

| 项目 | 实际值 |
| --- | --- |
| EdgeOne Makers 项目 | `kplgame2` |
| 加速区域 | 全球可用区（不含中国大陆） |
| Git 仓库 / 生产分支 | `KQ-KUN/kplgame` / `main` |
| 框架 / 根目录 | Other / `./` |
| Node.js | `24.18.0` |
| 安装命令 | `npm run checkout && npm run install:games` |
| 构建命令 | `npm test && npm run build` |
| 输出目录 | `dist` |
| 正式域名 | `https://kplgame.cn` |
| EdgeOne 显示的 CNAME 目标 | `kplgame.cn.pages.dnsoe5.com` |
| HTTPS | EdgeOne 免费证书已部署；HTTP 以 302 跳转 HTTPS |

2026-09-23 手动触发的生产部署 `dp9t0ryh5rc9` 已成功：日志确认 Node 版本、两个锁定游戏提交的 checkout、测试、构建、产物校验和上传。Git push 自动发布链路需以一次新的 `main` push 及其 EdgeOne 部署记录单独验收，不能仅凭“自动部署已开启”断言通过。

`.github/workflows/build.yml` 也会对 `main` 执行 checkout、安装、测试、聚合与验证，上传 `kplgame-dist` 和报告；GitHub Actions 构建成功与 EdgeOne 上线分别验收。游戏源码更新后须主动更新注册表 ref，防止上游 main 无意改变正式站。构建环境必须能读取三个公开游戏仓库；`sources/` 是临时目录，不能复用脏 checkout。

域名和免费 HTTPS 已接入；后续 DNS 变更只使用控制台实际给出的记录值，不猜目标，也不购买商业 SSL。

## 大陆访问事实与限制（2026-09-21 核对官方文档）

[域名说明](https://pages.edgeone.ai/document/domain-overview) 当前指出：中国大陆访问项目/部署默认域名需使用有效期 3 小时的预览 URL；稳定入口应绑定自定义域名。全球可用区（不含中国大陆）不要求 ICP 注册；含大陆区域要求备案。见 [自定义域名](https://pages.edgeone.ai/document/custom-domain)。这些是平台规则，不代表已证明 kplgame.cn 在所有大陆网络质量达标。

上线验收要在普通大陆网络（至少移动与固定宽带）测首页、两个子目录直接访问/刷新、加载和完整玩法；记录日期、网络、首屏耗时、失败请求。核心资源自托管可以减少境外依赖，但不能保证跨境链路质量。默认域名能访问也不能替代自定义域名验收。

## CloudBase 与回滚

已知兼容地址：`https://kpl2k-kpl2k-d0gigrx6e89914f65.webapps.tcloudbase.com`。旧说明可能写目标 app，也可能已迁移为完整 dist；以控制台和真实响应为准。本轮保留旧 portal、guessing、link、根 package/build 配置，不以新平台状态判断旧站健康。

2026-09-23 上线后旧站 `/`、`/kpl2k/`、`/guessing/` 均返回 HTTP 200。新站失败时回滚到上一份已验证的 dist 或上一个平台 commit + 锁定游戏 refs；不要删旧部署。只有新体系和线上入口均验收成功，另行讨论清理。
