# 发布与回滚

计划正式入口 `https://kplgame.cn`；CloudBase 长网址保留为兼容/备用站。本轮不创建云资源、不修改 DNS、不购买任何产品、不改变 CloudBase 设置，不推送旧 kpl2k main 触发它的旧自动部署。

## 已实现与待配置

`.github/workflows/build.yml` 自动执行源码 checkout、安装、测试、聚合、验证，上传 kplgame-dist 与报告。它只构建，不冒充已部署 EdgeOne。游戏源码更新后需主动更新注册表 ref（防止上游 main 无意破坏正式站）。

首次接入由用户在 EdgeOne Pages / Makers 控制台选择 **全球可用区（不含中国大陆）**，核对当时可用的免费额度/限制；任何收费步骤停止。可以先上传 GitHub Actions 的 dist 内容验证；Git 集成的项目根目录为本仓库根，构建命令为：

```sh
npm run checkout && npm run install:games && npm test && npm run build
```

输出目录 `dist`，Node.js 24。必须允许构建环境读取两个公开源仓库。源码 sources/ 为临时目录；若提供商持久缓存它，应取消该目录缓存或在全新构建环境运行，不能直接覆写脏 checkout。

控制台选择 Git 集成后可实现 push kplgame → 构建/测试 → 发布；当前未绑定账户和域名，因此不能声称该链路已线上跑通。先验证临时部署，再添加 kplgame.cn，按控制台给出的准确记录手动设置 DNS，不猜 CNAME 值，不购买 SSL。

## 大陆访问事实与限制（2026-09-21 核对官方文档）

[域名说明](https://pages.edgeone.ai/document/domain-overview) 当前指出：中国大陆访问项目/部署默认域名需使用有效期 3 小时的预览 URL；稳定入口应绑定自定义域名。全球可用区（不含中国大陆）不要求 ICP 注册；含大陆区域要求备案。见 [自定义域名](https://pages.edgeone.ai/document/custom-domain)。这些是平台规则，不代表已证明 kplgame.cn 在所有大陆网络质量达标。

上线验收要在普通大陆网络（至少移动与固定宽带）测首页、两个子目录直接访问/刷新、加载和完整玩法；记录日期、网络、首屏耗时、失败请求。核心资源自托管可以减少境外依赖，但不能保证跨境链路质量。默认域名能访问也不能替代自定义域名验收。

## CloudBase 与回滚

已知兼容地址：`https://kpl2k-kpl2k-d0gigrx6e89914f65.webapps.tcloudbase.com`。旧说明可能写目标 app，也可能已迁移为完整 dist；以控制台和真实响应为准。本轮保留旧 portal、guessing、link、根 package/build 配置，不以新平台状态判断旧站健康。

上线前记录旧站 `/`、`/kpl2k/`、`/guessing/` 状态。上线后复查。新站失败时回滚到上一份已验证的 dist 或上一个平台 commit + 锁定游戏 refs；不要删旧部署。只有新体系和线上入口均验收成功，另行讨论清理。
