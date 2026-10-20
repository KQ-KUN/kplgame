# 独立开发、数据更新、聚合与恢复

各游戏独立 checkout，Node 24；Guessing/Link/Merge 使用自身 npm ci、npm test、npm run build，2K 使用 npm test、npm run build，Coin零构建依赖，npm test、npm run build、npm run validate。各仓库README指明浏览器命令。typecheck负责TS静态类型，TS build已含typecheck；纯逻辑test不假称浏览器通过。2K validate只校验消费manifest，不重复npm test；2K新源码显式声明 kplgame.standaloneBuild=true 后，平台对原static注册项也会运行独立npm test/build，旧锁定ref不运行其历史Hub build。

数据维护与正式build分离：2K snapshot:sync、Guessing data:manifest、Link显式快照生成器、Merge prepare-audio、Coin data:manifest均需要实际输入源/完整SHA，审阅差异并保留未知，再核验最终资源hash。正式build只消费生成快照。原始证据不全时保留consumer snapshot来源层级，不能用新生成时间代替历史数据日期。

本地聚合在忽略的 config/local-sources.json 为游戏ID提供独立目录，依次运行 npm test、npm run build、npm run validate:data、npm run test:browser。build已经执行静态validate，未修改输出无需再重复。安装本地浏览器验收依赖可 npm ci --ignore-scripts 与 npx playwright install chromium，或者显式 KPL_PLAYWRIGHT_PATH 和 KPL_BROWSER_CHANNEL。Linux CI使用仓库固定Playwright；本批本地使用Windows Edge，不能当作云CI执行证据。

历史锁定游戏缺少新manifest时，build明确记录 legacy-unverified；不能把它算作新契约通过。validate:data为严格入口，缺少任何启用游戏manifest即失败。生产注册表本批不更新，因此CI在旧ref上的旧feature范围与本地新候选不同，报告分别记录；正式接入候选时再锁定其已提交SHA。聚合会注入统计helper和Hub导航，manifest先验证独立资源，聚合改写由build-report与浏览器另外验证。

未来经授权发布：检查六仓差异和完整SHA，先 release:game -- <id> --dry-run，再按RELEASE_PROTOCOL执行。dry-run不push、不等待线上；already-current也必须核对明确目标平台SHA并执行线上HTTP/浏览器smoke。reports/releases保留每次唯一journal，失败阶段与可恢复状态不要被latest覆盖。重试前读取上次targetSHA、game/platform远端和生产release-meta，不能依靠注册表ref未变宣称上线。

本批未授权推送、部署、删历史素材或CloudBase链。拟删除项目仅列清单及消费者证据，后续授权再动。真机、人工音频试听、线上缓存/Range、大陆网络与线上统计验收保持独立。
