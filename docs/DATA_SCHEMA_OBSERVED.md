# Canonical 数据字段实测

自动生成；数组 []、动态键 {} 合并统计全部值，missing 是该对象层缺字段次数。空字符串与 null 分别计数。

## formats.json

SHA256: `d1412e99316d440986cd7ea8183c668f07a0ad4ea4fed7ca17fbdaaf8d4e0328`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.data_version | str | 1 | 0 | 0 | 0 | "2026-08-15" |
| $.note | str | 1 | 0 | 0 | 0 | "赛制结构摘要：rounds 按真实赛程分组；playoffs 的具体树形在 M1 引擎阶段细化" |
| $.schema_version | str | 1 | 0 | 0 | 0 | "0.1" |
| $.seasons | dict | 1 | 0 | 0 | 0 |  |
| $.seasons{} | dict | 29 | 0 | 0 | 0 |  |
| $.seasons{}.champion_slug | str | 29 | 0 | 0 | 0 | "10006" |
| $.seasons{}.name | str | 29 | 0 | 0 | 0 | "2019KPL春季赛" |
| $.seasons{}.playoff_config | dict | 29 | 0 | 0 | 0 |  |
| $.seasons{}.playoff_config.bo | int | 29 | 0 | 0 | 0 | 7 |
| $.seasons{}.playoff_config.max_losses | int | 29 | 0 | 0 | 0 | 2 |
| $.seasons{}.playoff_config.qualify | int | 29 | 0 | 0 | 0 | 10 |
| $.seasons{}.playoff_config.type | str | 29 | 0 | 0 | 0 | "double_elim" |
| $.seasons{}.regular_format | dict | 29 | 0 | 0 | 0 |  |
| $.seasons{}.regular_format.advance | int | 9 | 0 | 0 | 20 | 4 |
| $.seasons{}.regular_format.bo5 | int | 2 | 0 | 0 | 27 | 5 |
| $.seasons{}.regular_format.bo7 | int | 2 | 0 | 0 | 27 | 7 |
| $.seasons{}.regular_format.de_bo | int | 2 | 0 | 0 | 27 | 7 |
| $.seasons{}.regular_format.elite | int | 2 | 0 | 0 | 27 | 6 |
| $.seasons{}.regular_format.final_bo | int | 4 | 0 | 0 | 25 | 7 |
| $.seasons{}.regular_format.groups | int | 8 | 0 | 0 | 21 | 2 |
| $.seasons{}.regular_format.masters | int | 2 | 0 | 0 | 27 | 6 |
| $.seasons{}.regular_format.playoff_qualify | int | 16 | 0 | 0 | 13 | 10 |
| $.seasons{}.regular_format.r2_mode | str | 12 | 0 | 0 | 17 | "swap" |
| $.seasons{}.regular_format.seeds | int | 1 | 0 | 0 | 28 | 2 |
| $.seasons{}.regular_format.type | str | 29 | 0 | 0 | 0 | "kpl_single" |
| $.seasons{}.rounds | list | 29 | 0 | 0 | 0 |  |
| $.seasons{}.rounds[] | dict | 141 | 0 | 0 | 0 |  |
| $.seasons{}.rounds[].bo | int | 141 | 0 | 0 | 0 | 0 |
| $.seasons{}.rounds[].matches | list | 141 | 0 | 0 | 0 |  |
| $.seasons{}.rounds[].matches[] | dict | 2738 | 0 | 0 | 0 |  |
| $.seasons{}.rounds[].matches[].a_group | str | 2232 | 0 | 0 | 506 | "A" |
| $.seasons{}.rounds[].matches[].a_id | str | 2738 | 0 | 0 | 0 | "10007" |
| $.seasons{}.rounds[].matches[].a_name | str | 2738 | 0 | 0 | 0 | "Hero久竞" |
| $.seasons{}.rounds[].matches[].a_score | int | 2738 | 0 | 0 | 0 | 3 |
| $.seasons{}.rounds[].matches[].b_group | str | 2232 | 0 | 0 | 506 | "A" |
| $.seasons{}.rounds[].matches[].b_id | str | 2738 | 0 | 0 | 0 | "10001" |
| $.seasons{}.rounds[].matches[].b_name | str | 2738 | 0 | 0 | 0 | "QGhappy" |
| $.seasons{}.rounds[].matches[].b_score | int | 2738 | 0 | 0 | 0 | 1 |
| $.seasons{}.rounds[].matches[].scheduleid | str | 2232 | 0 | 0 | 506 | "KPL2019S1M1W1D1" |
| $.seasons{}.rounds[].matches[].status | int | 2738 | 0 | 0 | 0 | 4 |
| $.seasons{}.rounds[].matches[].ts | str | 2738 | 0 | 0 | 0 | "1551866400" |
| $.seasons{}.rounds[].name | str | 141 | 0 | 0 | 0 | "常规赛" |
| $.seasons{}.rounds[].type | str | 141 | 0 | 0 | 0 | "round_robin" |
| $.seasons{}.season_id | str | 29 | 0 | 0 | 0 | "L20190001" |
| $.seasons{}.source | str | 29 | 0 | 0 | 0 | "kpl" |
| $.seasons{}.teams_by_group | dict | 29 | 0 | 0 | 0 |  |
| $.seasons{}.teams_by_group.A | list | 18 | 0 | 0 | 11 |  |
| $.seasons{}.teams_by_group.A[] | str | 225 | 0 | 0 | 0 | "10007" |
| $.seasons{}.teams_by_group.B | list | 12 | 0 | 0 | 17 |  |
| $.seasons{}.teams_by_group.B[] | str | 115 | 0 | 0 | 0 | "10002" |
| $.seasons{}.teams_by_group.D | list | 6 | 0 | 0 | 23 |  |
| $.seasons{}.teams_by_group.D[] | str | 37 | 0 | 0 | 0 | "10001" |
| $.seasons{}.teams_by_group.S | list | 14 | 0 | 0 | 15 |  |
| $.seasons{}.teams_by_group.S[] | str | 133 | 0 | 0 | 0 | "10008" |

## franchises.json

SHA256: `3bb3bea7aa2385d8c9ecc9130c6134ba9ac73d9cbe2f3246deb761dc58d1e763`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.data_version | str | 1 | 0 | 0 | 0 | "2026-08-15" |
| $.franchises | list | 1 | 0 | 0 | 0 |  |
| $.franchises[] | dict | 84 | 0 | 0 | 0 |  |
| $.franchises[].abbreviations | list | 84 | 0 | 0 | 0 |  |
| $.franchises[].abbreviations[] | str | 78 | 0 | 0 | 0 | "狼队" |
| $.franchises[].current_names | list | 84 | 0 | 0 | 0 |  |
| $.franchises[].current_names[] | str | 84 | 0 | 0 | 0 | "重庆狼队" |
| $.franchises[].franchise_id | str | 84 | 0 | 0 | 0 | "10001" |
| $.franchises[].names_by_season | dict | 84 | 0 | 0 | 0 |  |
| $.franchises[].names_by_season{} | str | 371 | 0 | 0 | 0 | "重庆狼队" |
| $.franchises[].seasons | list | 84 | 0 | 0 | 0 |  |
| $.franchises[].seasons[] | str | 467 | 0 | 0 | 0 | "KCC2020W" |
| $.franchises[].slug | str,NoneType | 84 | 52 | 0 | 0 | "qghappy" |
| $.schema_version | str | 1 | 0 | 0 | 0 | "0.1" |
| $.unmatched | list | 1 | 0 | 0 | 0 |  |
| $.unmatched[] | dict | 52 | 0 | 0 | 0 |  |
| $.unmatched[].abbreviations | list | 52 | 0 | 0 | 0 |  |
| $.unmatched[].abbreviations[] | str | 47 | 0 | 0 | 0 | "KZ" |
| $.unmatched[].franchise_id | str | 52 | 0 | 0 | 0 | "10011" |
| $.unmatched[].names | list | 52 | 0 | 0 | 0 |  |
| $.unmatched[].names[] | str | 52 | 0 | 0 | 0 | "KZ" |
| $.unmatched[].note | str | 52 | 0 | 0 | 0 | "未匹配到 kpl slug，可能为境外队/已解散队" |

## franchises_draft.json

SHA256: `3cb2fe30deff8610835eb66f5fd1d93df515276bf342d8f3102b6ed049ebb918`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.data_version | str | 1 | 0 | 0 | 0 | "2026-08-15" |
| $.franchises | list | 1 | 0 | 0 | 0 |  |
| $.franchises[] | dict | 84 | 0 | 0 | 0 |  |
| $.franchises[].abbreviations | list | 84 | 0 | 0 | 0 |  |
| $.franchises[].abbreviations[] | str | 78 | 0 | 0 | 0 | "狼队" |
| $.franchises[].franchise_id | str | 84 | 0 | 0 | 0 | "10001" |
| $.franchises[].names | list | 84 | 0 | 0 | 0 |  |
| $.franchises[].names[] | str | 84 | 0 | 0 | 0 | "重庆狼队" |
| $.franchises[].seasons | list | 84 | 0 | 0 | 0 |  |
| $.franchises[].seasons[] | str | 545 | 0 | 0 | 0 | "KCC2020W" |
| $.note | str | 1 | 0 | 0 | 0 | "smoba 俱乐部稳定 ID 草稿；显示名为当前名，历史改名映射待用 kpl.qq.com 赛季战队表对齐" |
| $.schema_version | str | 1 | 0 | 0 | 0 | "0.1" |

## historical_archive.json

SHA256: `2b49ea788066689123ba46a65382a18e6270c2f4d09c7f752f54754b3576e384`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.generated_at | str | 1 | 0 | 0 | 0 | "2026-08-30T07:42:14.656415+00:00" |
| $.match_count | int | 1 | 0 | 0 | 0 | 587 |
| $.playable | bool | 1 | 0 | 0 | 0 | false |
| $.playable_note | str | 1 | 0 | 0 | 0 | "旧接口未提供可核验的首发阵容和个人统计，因此不进入模拟战场。" |
| $.schema_version | str | 1 | 0 | 0 | 0 | "1.0" |
| $.scope | str | 1 | 0 | 0 | 0 | "2016—2018 KPL 官方赛程与赛果" |
| $.season_count | int | 1 | 0 | 0 | 0 | 5 |
| $.seasons | list | 1 | 0 | 0 | 0 |  |
| $.seasons[] | dict | 5 | 0 | 0 | 0 |  |
| $.seasons[].champion | str | 5 | 0 | 0 | 0 | "AS仙阁" |
| $.seasons[].final_score | str | 5 | 0 | 0 | 0 | "2:3" |
| $.seasons[].final_team_a | str | 5 | 0 | 0 | 0 | "AG超玩会" |
| $.seasons[].final_team_b | str | 5 | 0 | 0 | 0 | "AS仙阁" |
| $.seasons[].match_count | int | 5 | 0 | 0 | 0 | 74 |
| $.seasons[].matches | list | 5 | 0 | 0 | 0 |  |
| $.seasons[].matches[] | dict | 587 | 0 | 0 | 0 |  |
| $.seasons[].matches[].hasStarterInfo | bool | 587 | 0 | 0 | 0 | false |
| $.seasons[].matches[].scheduleId | str | 587 | 0 | 0 | 0 | "wzry_1_1" |
| $.seasons[].matches[].stageId | str | 587 | 0 | 0 | 0 | "cgs" |
| $.seasons[].matches[].stageName | str | 587 | 0 | 0 | 0 | "常规赛" |
| $.seasons[].matches[].startTimestamp | int | 587 | 0 | 0 | 0 | 1474099200 |
| $.seasons[].matches[].status | int | 587 | 0 | 0 | 0 | 4 |
| $.seasons[].matches[].teamAId | str | 587 | 0 | 0 | 0 | "KPL2016QJS_estar" |
| $.seasons[].matches[].teamAName | str | 587 | 0 | 0 | 0 | "eStar" |
| $.seasons[].matches[].teamAScore | int | 587 | 0 | 0 | 0 | 2 |
| $.seasons[].matches[].teamBId | str | 587 | 0 | 0 | 0 | "KPL2016QJS_vgh" |
| $.seasons[].matches[].teamBName | str | 587 | 0 | 0 | 0 | "VgHow" |
| $.seasons[].matches[].teamBScore | int | 587 | 0 | 0 | 0 | 0 |
| $.seasons[].name | str | 5 | 0 | 0 | 0 | "2016KPL秋季赛" |
| $.seasons[].runner_up | str | 5 | 0 | 0 | 0 | "AG超玩会" |
| $.seasons[].season_id | str | 5 | 0 | 0 | 0 | "KPL2016QJS" |
| $.seasons[].stage_counts | dict | 5 | 0 | 0 | 0 |  |
| $.seasons[].stage_counts.季后赛 | int | 5 | 0 | 0 | 0 | 13 |
| $.seasons[].stage_counts.常规赛 | int | 5 | 0 | 0 | 0 | 60 |
| $.seasons[].stage_counts.总决赛 | int | 5 | 0 | 0 | 0 | 1 |
| $.seasons[].team_count | int | 5 | 0 | 0 | 0 | 12 |
| $.seasons[].teams | list | 5 | 0 | 0 | 0 |  |
| $.seasons[].teams[] | dict | 62 | 0 | 0 | 0 |  |
| $.seasons[].teams[].teamId | str | 62 | 0 | 0 | 0 | "KPL2016QJS_xq" |
| $.seasons[].teams[].teamLogo | str | 62 | 0 | 0 | 0 | "http://imgcache-1251786003.image.myqcloud.com/media/gzhoss/image/20170320/e77ef3bc65ac525200d90cefd |
| $.seasons[].teams[].teamName | str | 62 | 0 | 0 | 0 | "XQ" |
| $.seasons[].year | int | 5 | 0 | 0 | 0 | 2016 |
| $.source | str | 1 | 0 | 0 | 0 | "https://kplshop-op.timi-esports.qq.com/kplow" |

## historical_player_meta.json

SHA256: `df1efc83635a3184f7630f916224df0e6aff4ce7f8a8512e9f78d187cb2c7783`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.mapping_report | dict | 1 | 0 | 0 | 0 |  |
| $.mapping_report.ambiguous | list | 1 | 0 | 0 | 0 |  |
| $.mapping_report.matched | int | 1 | 0 | 0 | 0 | 73 |
| $.mapping_report.unmatched_names | list | 1 | 0 | 0 | 0 |  |
| $.mapping_report.unmatched_names[] | str | 6 | 0 | 0 | 0 | "Song" |
| $.records | dict | 1 | 0 | 0 | 0 |  |
| $.records{} | dict | 73 | 0 | 0 | 0 |  |
| $.records{}.championship_count | int,NoneType | 73 | 1 | 0 | 0 | 1 |
| $.records{}.championship_count_source | str | 73 | 0 | 0 | 0 | "curated-finals-starters-v1" |
| $.records{}.championship_events | list | 73 | 0 | 0 | 0 |  |
| $.records{}.championship_events[] | str | 187 | 0 | 0 | 0 | "KCC2019W" |
| $.records{}.debut_year | NoneType,int | 73 | 43 | 0 | 0 | null |
| $.records{}.debut_year_source | NoneType,str | 73 | 43 | 0 | 0 | null |
| $.records{}.name | str | 73 | 0 | 0 | 0 | "770" |
| $.schema_version | str | 1 | 0 | 0 | 0 | "1.0" |
| $.sources | dict | 1 | 0 | 0 | 0 |  |
| $.sources.championship_count | dict | 1 | 0 | 0 | 0 |  |
| $.sources.championship_count.countingRule | str | 1 | 0 | 0 | 0 | "只统计总决赛冠军方五人首发；不统计替补、教练、资格赛、KWC 和 KPL 梦之队邀请赛" |
| $.sources.championship_count.description | str | 1 | 0 | 0 | 0 | "用户提供的 KPL 历届冠军与总决赛首发阵容表，并以 Liquipedia 赛事结果交叉核对" |
| $.sources.championship_count.verifiedAt | str | 1 | 0 | 0 | 0 | "2026-08-30" |
| $.sources.debut_year | dict | 1 | 0 | 0 | 0 |  |
| $.sources.debut_year.api | str | 1 | 0 | 0 | 0 | "https://liquipedia.net/honorofkings/api.php" |
| $.sources.debut_year.championshipScope | dict | 1 | 0 | 0 | 0 |  |
| $.sources.debut_year.championshipScope.excluded | list | 1 | 0 | 0 | 0 |  |
| $.sources.debut_year.championshipScope.excluded[] | str | 2 | 0 | 0 | 0 | "Honor of Kings World Cup " |
| $.sources.debut_year.championshipScope.includedPatterns | list | 1 | 0 | 0 | 0 |  |
| $.sources.debut_year.championshipScope.includedPatterns[] | str | 6 | 0 | 0 | 0 | "King Pro League (?:Spring\|Summer\|Fall\|Autumn) \\d{4}" |
| $.sources.debut_year.license | str | 1 | 0 | 0 | 0 | "CC BY-SA 3.0" |
| $.sources.debut_year.provider | str | 1 | 0 | 0 | 0 | "Liquipedia Honor of Kings Wiki" |
| $.sources.debut_year.retrievedAt | str | 1 | 0 | 0 | 0 | "2026-08-30T13:17:32+00:00" |

## pair_win.json

SHA256: `3367e846ff66978a2ae0dd9c3cdaeb335bf5b0b70d095870e9b07f7c65a90b9c`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.data_version | str | 1 | 0 | 0 | 0 | "2026-08-16" |
| $.pair_win | dict | 1 | 0 | 0 | 0 |  |
| $.pair_win{} | dict | 8138 | 0 | 0 | 0 |  |
| $.pair_win{}{} | int | 16276 | 0 | 0 | 0 | 7 |
| $.player_win | dict | 1 | 0 | 0 | 0 |  |
| $.player_win{} | dict | 3372 | 0 | 0 | 0 |  |
| $.player_win{}{} | int | 6744 | 0 | 0 | 0 | 12 |
| $.schema_version | str | 1 | 0 | 0 | 0 | "0.1" |

## player_attribution.json

SHA256: `89359f4b290a1580b649a601f098dd35c6bb030044b3855f538b018066d69b41`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.data_version | str | 1 | 0 | 0 | 0 | "2026-08-15" |
| $.records | list | 1 | 0 | 0 | 0 |  |
| $.records[] | dict | 3374 | 0 | 0 | 0 |  |
| $.records[].avg_assist_num | float | 3374 | 0 | 0 | 0 | 6.778 |
| $.records[].avg_be_hurt_rate | float | 3374 | 0 | 0 | 0 | 0.22 |
| $.records[].avg_death_num | float | 3374 | 0 | 0 | 0 | 2.889 |
| $.records[].avg_dpm | float | 3374 | 0 | 0 | 0 | 3116.9 |
| $.records[].avg_gpm | float | 3374 | 0 | 0 | 0 | 506.8 |
| $.records[].avg_hurt_rate | float | 3374 | 0 | 0 | 0 | 0.2044 |
| $.records[].avg_kda | float,NoneType | 3374 | 8 | 0 | 0 | 2.808 |
| $.records[].avg_kill_num | float | 3374 | 0 | 0 | 0 | 1.333 |
| $.records[].avg_participation_rate | float | 3374 | 0 | 0 | 0 | 70.56 |
| $.records[].games | int | 3374 | 0 | 0 | 0 | 9 |
| $.records[].heroes | list | 3374 | 0 | 0 | 0 |  |
| $.records[].heroes[] | str | 31155 | 0 | 0 | 0 | "姜子牙" |
| $.records[].mvp_count | int | 3374 | 0 | 0 | 0 | 0 |
| $.records[].player_icon | str | 3374 | 0 | 4 | 0 | "https://smobatv-pic.tga.qq.com/3c367d6e5ca7a2b79a685f05a1eb8589.png" |
| $.records[].player_name | str | 3374 | 0 | 0 | 0 | "An" |
| $.records[].position | str | 3374 | 0 | 0 | 0 | "对抗路" |
| $.records[].season_id | str | 3374 | 0 | 0 | 0 | "KCC2020W" |
| $.records[].team_franchise | str | 3374 | 0 | 0 | 0 | "10034" |
| $.schema_version | str | 1 | 0 | 0 | 0 | "0.1" |

## player_icon_cache.json

SHA256: `6fc054ee2f394cc292ad40885ddad7ee2c817b3b72f6123d01f7de8fe695d09e`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.icons | dict | 1 | 0 | 0 | 0 |  |
| $.icons{} | str | 732 | 0 | 0 | 0 | "assets/player-icons/b5e4d5514363f8b1fc5a.webp" |
| $.schema_version | str | 1 | 0 | 0 | 0 | "0.1" |

## player_library.json

SHA256: `db78010e6481dd9e04f0dca645536a9ccdefa219bfe3f3b3a8727417254b1017`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.data_version | str | 1 | 0 | 0 | 0 | "2026-08-30" |
| $.players | list | 1 | 0 | 0 | 0 |  |
| $.players[] | dict | 701 | 0 | 0 | 0 |  |
| $.players[].active | bool | 701 | 0 | 0 | 0 | false |
| $.players[].championship_count | int,NoneType | 701 | 549 | 0 | 0 | 1 |
| $.players[].championship_events | list | 701 | 0 | 0 | 0 |  |
| $.players[].championship_events[] | str | 415 | 0 | 0 | 0 | "KPL2020S2" |
| $.players[].current_team | NoneType,str | 701 | 573 | 0 | 0 | null |
| $.players[].debut_year | NoneType,int | 701 | 627 | 0 | 0 | null |
| $.players[].icon | str | 701 | 0 | 0 | 0 | "https://smobatv-pic.tga.qq.com/bfbff96ec7d688f2bbd21d76cc21ab7b.png" |
| $.players[].id | str | 701 | 0 | 0 | 0 | "7D1D29C1629432D8FA2E1CE299D1DF0C@10008" |
| $.players[].last_order | int | 701 | 0 | 0 | 0 | 19 |
| $.players[].legend | bool | 701 | 0 | 0 | 0 | false |
| $.players[].mvp_total | int | 701 | 0 | 0 | 0 | 86 |
| $.players[].name | str | 701 | 0 | 0 | 0 | "小义" |
| $.players[].peak_rating | float | 701 | 0 | 0 | 0 | 98.1 |
| $.players[].positions | list | 701 | 0 | 0 | 0 |  |
| $.players[].positions[] | str | 706 | 0 | 0 | 0 | "打野" |
| $.players[].real_name | str | 701 | 0 | 701 | 0 | "" |
| $.players[].team | str | 701 | 0 | 0 | 0 | "深圳DYG" |
| $.players[].team_fid | str | 701 | 0 | 0 | 0 | "10008" |
| $.players[].version_count | int | 701 | 0 | 0 | 0 | 4 |
| $.players[].versions | list | 701 | 0 | 0 | 0 |  |
| $.players[].versions[] | dict | 1235 | 0 | 0 | 0 |  |
| $.players[].versions[].assists | float | 1235 | 0 | 0 | 0 | 3.89 |
| $.players[].versions[].be_hurt_rate | float | 1235 | 0 | 0 | 0 | 14.5 |
| $.players[].versions[].damage_convert | float,int | 1235 | 0 | 0 | 0 | 0.74 |
| $.players[].versions[].dpm | float | 1235 | 0 | 0 | 0 | 42954.7 |
| $.players[].versions[].games | int | 1235 | 0 | 0 | 0 | 80 |
| $.players[].versions[].gpm | float | 1235 | 0 | 0 | 0 | 835.4 |
| $.players[].versions[].heroes | list | 1235 | 0 | 0 | 0 |  |
| $.players[].versions[].heroes[] | str | 16123 | 0 | 0 | 0 | "云中君" |
| $.players[].versions[].hurt_rate | float | 1235 | 0 | 0 | 0 | 18.6 |
| $.players[].versions[].kda | float | 1235 | 0 | 0 | 0 | 6.32 |
| $.players[].versions[].kills | float,int | 1235 | 0 | 0 | 0 | 4.77 |
| $.players[].versions[].mvp_count | int | 1235 | 0 | 0 | 0 | 15 |
| $.players[].versions[].mvp_per_game | float | 1235 | 0 | 0 | 0 | 0.188 |
| $.players[].versions[].participation | float | 1235 | 0 | 0 | 0 | 65.5 |
| $.players[].versions[].peak | bool | 1235 | 0 | 0 | 0 | true |
| $.players[].versions[].position | str | 1235 | 0 | 0 | 0 | "打野" |
| $.players[].versions[].rating | float | 1235 | 0 | 0 | 0 | 98.1 |
| $.players[].versions[].season_label | str | 1235 | 0 | 0 | 0 | "2020年" |
| $.players[].versions[].team | str | 1235 | 0 | 0 | 0 | "深圳DYG" |
| $.players[].versions[].towers | float,int | 1235 | 0 | 0 | 0 | 1.64 |
| $.players[].versions[].win_rate | float,int | 1235 | 0 | 0 | 0 | 0.725 |
| $.players[].versions[].year | int | 1235 | 0 | 0 | 0 | 2020 |
| $.schema_version | str | 1 | 0 | 0 | 0 | "0.2" |

## player_season_stats.json

SHA256: `79aa66436176f4cd0a4b3fae08403f27cf756fecd334b08971a042f7875ccd86`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.data_version | str | 1 | 0 | 0 | 0 | "2026-08-15" |
| $.records | list | 1 | 0 | 0 | 0 |  |
| $.records[] | dict | 3290 | 0 | 0 | 0 |  |
| $.records[].avg_assist_num | float,int | 3290 | 0 | 0 | 0 | 4.2025 |
| $.records[].avg_be_hurt_by_hero_total_rate | float | 3290 | 0 | 0 | 0 | 0.1295 |
| $.records[].avg_damage_convert_rate | float,int,NoneType | 3290 | 137 | 0 | 0 | 0.9883 |
| $.records[].avg_death_num | float,int | 3290 | 0 | 0 | 0 | 1.3924 |
| $.records[].avg_gold | float,int,NoneType | 3290 | 137 | 0 | 0 | 12544.76 |
| $.records[].avg_gold_rate | float,NoneType | 3290 | 137 | 0 | 0 | 0.2313 |
| $.records[].avg_gpm | float,int | 3290 | 0 | 0 | 0 | 722.2911 |
| $.records[].avg_hurt_to_hero_total_rate | float | 3290 | 0 | 0 | 0 | 0.2322 |
| $.records[].avg_kda | float,int | 3290 | 0 | 0 | 0 | 5.6506 |
| $.records[].avg_kill_num | float,int | 3290 | 0 | 0 | 0 | 3.6076 |
| $.records[].avg_participation_rate | float,int | 3290 | 0 | 0 | 0 | 70.5316 |
| $.records[].avg_per_min_hurt_total | float,int | 3290 | 0 | 0 | 0 | 37388.984 |
| $.records[].avg_push_tower_num | float,int,NoneType | 3290 | 137 | 0 | 0 | 1.8481 |
| $.records[].games | int | 3290 | 0 | 0 | 0 | 79 |
| $.records[].is_captain | int | 3290 | 0 | 0 | 0 | 0 |
| $.records[].league_id | str | 3290 | 0 | 0 | 0 | "20190001" |
| $.records[].mvp_count | int | 3290 | 0 | 0 | 0 | 11 |
| $.records[].mvp_per_game | float | 3290 | 0 | 0 | 0 | 0.1392 |
| $.records[].player_id | str | 3290 | 0 | 0 | 0 | "6317ACA4810A9CE2501FA24B0050C02F" |
| $.records[].position | str | 3290 | 0 | 0 | 0 | "打野" |
| $.records[].rating | float | 3290 | 0 | 0 | 0 | 95.5 |
| $.records[].rating_components | dict | 3290 | 0 | 0 | 0 |  |
| $.records[].rating_components.metrics | dict | 2909 | 0 | 0 | 381 |  |
| $.records[].rating_components.metrics.assists | float | 1264 | 0 | 0 | 1645 | 13.8 |
| $.records[].rating_components.metrics.be_hurt_rate | float | 1858 | 0 | 0 | 1051 | 6.3 |
| $.records[].rating_components.metrics.damage_convert | float | 550 | 0 | 0 | 2359 | 13.0 |
| $.records[].rating_components.metrics.gold_rate | float | 1051 | 0 | 0 | 1858 | 14.9 |
| $.records[].rating_components.metrics.gpm | float | 550 | 0 | 0 | 2359 | 4.9 |
| $.records[].rating_components.metrics.hurt_rate | float | 2195 | 0 | 0 | 714 | 7.8 |
| $.records[].rating_components.metrics.kda | float | 2909 | 0 | 0 | 0 | 13.7 |
| $.records[].rating_components.metrics.kills | float | 2195 | 0 | 0 | 714 | 24.9 |
| $.records[].rating_components.metrics.mvp | float | 2909 | 0 | 0 | 0 | 10.3 |
| $.records[].rating_components.metrics.participation | float | 2315 | 0 | 0 | 594 | 15.0 |
| $.records[].rating_components.metrics.towers | float | 1846 | 0 | 0 | 1063 | 7.4 |
| $.records[].rating_components.sample | float | 2909 | 0 | 0 | 381 | 1.0 |
| $.records[].season_id | str | 3290 | 0 | 0 | 0 | "L20190001" |
| $.records[].team_franchise | str | 3290 | 0 | 0 | 0 | "10006" |
| $.records[].team_name_current | str | 3290 | 0 | 137 | 0 | "武汉eStarPro" |
| $.records[].win_rate | float,int,NoneType | 3290 | 137 | 0 | 0 | 0.6329 |
| $.schema_version | str | 1 | 0 | 0 | 0 | "0.1" |

## players.json

SHA256: `2a707b47472a1859a33b1139548c7c6d793845bc826fa5bc54ec06eb94b6e6c4`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.data_version | str | 1 | 0 | 0 | 0 | "2026-08-15" |
| $.players | list | 1 | 0 | 0 | 0 |  |
| $.players[] | dict | 746 | 0 | 0 | 0 |  |
| $.players[].name | str | 746 | 0 | 0 | 0 | "花海" |
| $.players[].player_icon | str | 746 | 0 | 0 | 0 | "https://smobatv-pic.tga.qq.com/b9e1edf17a454799bf17192c84a54fb3.png" |
| $.players[].player_id | str | 746 | 0 | 0 | 0 | "6317ACA4810A9CE2501FA24B0050C02F" |
| $.players[].positions | list | 746 | 0 | 0 | 0 |  |
| $.players[].positions[] | str | 754 | 0 | 0 | 0 | "发育路" |
| $.players[].real_name | str | 746 | 0 | 746 | 0 | "" |
| $.players[].teams | dict | 746 | 0 | 0 | 0 |  |
| $.players[].teams{} | str | 3290 | 0 | 0 | 0 | "10006" |
| $.schema_version | str | 1 | 0 | 0 | 0 | "0.1" |

## seasons.json

SHA256: `c6645f98bf1345d121dcfd1e4c24ff3a9da3526fe429d14561ced5ad258f8dfa`

| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| $ | dict | 1 | 0 | 0 | 0 |  |
| $.data_version | str | 1 | 0 | 0 | 0 | "2026-08-15" |
| $.schema_version | str | 1 | 0 | 0 | 0 | "0.1" |
| $.seasons | list | 1 | 0 | 0 | 0 |  |
| $.seasons[] | dict | 32 | 0 | 0 | 0 |  |
| $.seasons[].champion_franchise | str | 32 | 0 | 0 | 0 | "10006" |
| $.seasons[].data_version | str | 32 | 0 | 0 | 0 | "2026-08-15" |
| $.seasons[].end_time | str | 32 | 0 | 0 | 0 | "2019-06-02" |
| $.seasons[].is_battlefield | bool | 32 | 0 | 0 | 0 | true |
| $.seasons[].league_id | str | 32 | 0 | 0 | 0 | "20190001" |
| $.seasons[].league_type | str | 32 | 0 | 0 | 0 | "kpl" |
| $.seasons[].name | str | 32 | 0 | 0 | 0 | "2019KPL春季赛" |
| $.seasons[].runner_up_franchise | str | 32 | 0 | 0 | 0 | "10009" |
| $.seasons[].schema_version | str | 32 | 0 | 0 | 0 | "0.1" |
| $.seasons[].season_id | str | 32 | 0 | 0 | 0 | "L20190001" |
| $.seasons[].start_time | str | 32 | 0 | 0 | 0 | "2019-03-06" |
| $.seasons[].status | int | 32 | 0 | 0 | 0 | 2 |
| $.seasons[].year | int | 32 | 0 | 0 | 0 | 2019 |
