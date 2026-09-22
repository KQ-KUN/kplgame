# KPL 数据交接

当前唯一 canonical 是 `KQ-KUN/kpl2k/data/`。`processed/` 是生成结果，人工修正优先进入原有 overrides/生产管线，不能在新游戏里悄悄改事实。`app/data/` 与 Guessing `public/data/` 是消费快照，不能反向视为原始事实。

已读取全部指定 JSON；完整字段、类型、缺失/null/空串和哈希在 [字段实测](DATA_SCHEMA_OBSERVED.md)，重复与关联审计在 [DATA_AUDIT.json](DATA_AUDIT.json)。复查命令：`python scripts/audit-data.py --source <kpl2k checkout>`。这些是实测 schema，不沿用旧 docs/data-schema.md 示例。

| 文件（均在 data/processed） | 实际根结构和用途 |
| --- | --- |
| players.json | schema_version、data_version、players[]；人物基础档。每项 player_id、name、real_name、positions[]、teams{season_id: franchise_id}、player_icon。没有通用 aliases、active 或当前 team 字段；real_name 常为空 |
| historical_player_meta.json | schema_version、sources、records{player_id: metadata}、mapping_report；debut_year、championship_count、championship_events 及来源。null 表示未知，不能改成 0；冠军事件和数量未必能互相推算 |
| player_library.json | schema_version、data_version、players[]；2K 展示库。id 可为 player_id@franchise_id，非全局人物主键；name、real_name、icon、positions、legend、peak_rating、version_count、team、team_fid、active、current_team、last_order、mvp_total、debut_year、championship_count/events、versions[] 等，完整可选字段看实测。versions 是年度/战队/位置版本，含 rating、games、win_rate 等，不保证含 season_id |
| seasons.json | schema_version、data_version、seasons[]；每项 league_id、season_id、name、year、league_type、start_time、end_time、status、is_battlefield、champion_franchise、runner_up_franchise 等。没有统一 split 字段；按时间排序，不按 season_id 字典序 |
| franchises.json | schema_version、data_version、franchises[]、unmatched[]；franchise_id、slug、current_names[]、abbreviations[]、names_by_season{}、seasons[]。赛季名称映射描述品牌变迁，但不是完整法律实体/收购关系数据库。unmatched 必须保留 |
| franchises_draft.json | franchises[] 的 franchise_id、names、abbreviations、seasons；中间草稿，当前展示名可能污染历史，优先用正式 franchises |
| player_season_stats.json | schema_version、data_version、records[]；player_id、season_id、league_id、team_franchise、team_name_current、position、is_captain、games、win_rate、avg_kda、avg_kill_num、avg_death_num、avg_assist_num、avg_gold、avg_gpm、avg_per_min_hurt_total、avg_participation_rate、avg_gold_rate、avg_hurt_to_hero_total_rate、avg_be_hurt_by_hero_total_rate、avg_damage_convert_rate、avg_push_tower_num 等；适合赛季统计题、Grid 条件与 Draft/Lineup 候选事实，不应把该文件直接当含 rating 的最终评分表 |
| player_attribution.json | schema_version、data_version、records[]；season_id、player_name、team_franchise、position、player_icon、games、heroes[]、mvp_count 与 avg_*；没有 player_id、转会日期或完整赛季内多队经历 |
| player_icon_cache.json | schema_version、icons{player_id: app-relative path}；值如 assets/player-icons/*.webp，文件在 app/ 下。复制到新游戏自身 assets，并重写相对路径，不能直接指向 /kpl2k/ |
| historical_archive.json | schema_version、generated_at、source、scope、playable:false、playable_note、season_count、match_count、seasons[]；2016–2018 赛季结果、队伍、赛程、比分，适合冠军/决赛/时间线题；缺可靠首发不能拿来造队友边或模拟评分 |
| pair_win.json | schema_version、data_version、player_win{}、pair_win{}；key 分别为 season\|team\|name 和 season\|team\|排序后的nameA\|nameB，value 为 games、wins。源自逐局同队共同出场，胜率需 wins/games。不是对手胜率，也不是完整“曾经同队”名单 |
| formats.json | schema_version、data_version、note、seasons{season_id: format}；rounds（比赛/分组）、teams_by_group、champion_slug、playoff_config、regular_format 等。赛事赛制与模拟配置，不是人物资料 |

## ID 与空值边界

保留字符串 ID，不能转整数：player_id 有十六进制及 BTL 等补录形式；library 的 @ 后缀是展示版本身份。昵称重复和改名必须用来源、赛季、队伍进行人工/映射校验，禁止只靠名字合并。当前 players 没有 aliases 数组，不得凭空补字段。队伍优先 franchise_id，展示时用 names_by_season；team_name_current 不是历史队名。

season_id 混有 `L20190001`、`KPL2020S2`、`KCC2020W`，历史档案还有 `KPL2016QJS`；旧站 names_by_season 有另一套旧赛季命名。通过 seasons 的 league_id 与已有工具显式映射，不用正则猜春/夏/秋。null、缺字段、空串、0 分开处理；比例字段有 0–1 与百分数混用，不能统一乘 100。

`data_version` 中多个日期是脚本常量，即使内容包含 2026 夏季也可能仍标记 2026-08-15；使用源 commit + 文件 SHA256 + 生成时间判断快照，不能仅靠该日期。

## 历史归属和关系题风险

`tools/build_attribution.py` 按 (season_id, player_name) 聚合，注释称多数票，但实际 `votes[key]['team'] = team_id` 是最后遍历记录赋值，position 同样处理；glob 次序不是事件时间顺序。这个文件适合辅助清洗，不能证明赛季内唯一球队，更不能直接证明两人同场。

Link 的“同场队友”应优先使用逐局或 pair_win 的共同出场证据，保留源证据与样本量；“同队同赛季”是另一种产品规则，需明确标签。当前任务只记录问题，不改 canonical、不开发 Link。

## 头像与数据生产依赖

缓存文件必须检查存在再用；缺失/加载失败显示游戏自己的 fallback（现 2K 为姓名首字，Guessing 有本地默认头像）。原始 player_icon/library.icon 可能仍是腾讯 URL，不能宣称所有头像已本地化。

`tools/player_icons.py` 当前依赖 `guessing/public/data/player_library.json` 和 `guessing/public/assets/player-icons/`；后续删除兼容副本前需改成显式独立仓库输入。数据主流水线 `tools/rebuild_all.py` 依次执行归属、pair_win、清洗、赛制与赛程审计、历史档案、选手库、评分验证、队徽、Web 分片与版本验证。不要为发布门户运行全量采集/再生成。

## 新游戏消费方式

构建工具接受 `--source <kpl2k>`，读取上述所需文件、校验 schema/身份/空值、导出最小 `public/data/` 与自己的头像素材。输出 manifest 记录 source commit、每个输入 SHA256、schema、生成时间、覆盖与排除规则。浏览器只 fetch 自己的相对路径，不访问其他游戏私有目录。为未知身份、缺失赛季、重复昵称设有意义测试。先复用成熟快照；只有当前证据不足才另行规划补采。
