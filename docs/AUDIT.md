# 迁移前真实审计（2026-09-21）

根 package name 是 `kpl-game-hub`，workspace 已有 `guessing` 和 `link`；build 顺序为生成 Link 数据、构建 Guessing、构建 Link、运行 `tools/build_portal.mjs`。该脚本把 portal/app/guessing/dist/link/dist 分别复制到 dist 根和三个子目录。不是需求旧快照里的双游戏构建。

| 当前目录 | 实际职责 | 迁移决定 |
| --- | --- | --- |
| app | 2K 静态 HTML/CSS/JS、游戏用数据分片、图片音频 | 留在 kpl2k |
| data/raw、processed、overrides、narrative | 采集输入、清洗结果、人工修正与叙事数据 | 留在 kpl2k，禁止清理历史输入 |
| tools | 数据抓取/清洗/构建/验证，同时混有 Hub 和小工具打包 | 数据与2K工具保留；Hub 聚合由新仓库承担 |
| guessing | 本地竞猜业务和题库副本，旧 workspace 构建依赖 | 兼容保留；正式源码以 KPL-Guessing 为准 |
| portal | 旧总站 HTML/CSS、品牌素材与公告 | 复制迁移，旧站保留 |
| link | 已存在未提交实现和产品材料 | 保留用户改动，本轮不开发，不启用新平台注册项 |
| docs、MEMORY.md | 旧项目说明，有些 schema/部署记录滞后 | 保留，平台新文档优先描述新体系 |
| dist、output、tmp、node_modules、.venv | 构建产物、小工具交付、本地缓存与运行环境 | 不作为平台源码，不批量删除 |

开始时已有 package.json、lock、portal、build_portal、verify_release 等修改，以及 Link/小工具未跟踪文件。本轮不得提交或覆盖这些工作以假装迁移完成。

CloudBase 历史记录写 app 目录静态部署；当前代码支持统一 dist，控制台真实配置未由旧说明证明。必须检查线上返回和控制台，不能推断线上一定使用哪个版本。本轮不推送 kpl2k main，不改旧构建链和部署配置。

数据发现：旧 schema 文档中的 aliases/kpl_player_id、赛季 teams、统计 rating 等不能直接当成当前字段；归属生产器注释写“多数票”，实现却是遍历时最后赋值，不是投票。头像同步工具仍读 guessing/public，删除兼容目录会影响数据再生成。详见 DATA_HANDOFF。
