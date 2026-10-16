# KPL GAME 匿名统计

站点页面运行同域 `/shared/analytics.js` 后，向固定的 `/__event/*.txt` 发起 GET。事件文件内容为 `ok`，由构建生成；不使用 Cookie、持久用户 ID、指纹、数据库或第三方 tracker。请求不带用户输入、原始 UTM 参数和 Referer。`navigator.webdriver === true` 时不发送。请求失败不会影响游戏或跳转。

## 在 EdgeOne 查看

腾讯云 → EdgeOne → 数据分析 → 指标分析 → L7 访问请求数 → URL Path。筛选 **URL Path contains `/__event/`**，查看 URL Path 排行和时间趋势。事件路径的请求次数即对应事件次数。缓存命中、网络拦截或用户禁用 JavaScript 会造成偏差；这些数字不等于独立人数 UV。

| URL Path 中的事件 | 触发条件 |
| --- | --- |
| `pageview-portal`、`pageview-kpl2k`、`pageview-guessing`、`pageview-link`、`pageview-merge` | 对应页面 JavaScript 执行，每次文档生命周期至多一次 |
| `portal-click-kpl2k`、`portal-click-guessing`、`portal-click-link`、`portal-click-merge` | 首页点击对应游戏卡片，跳转不等待统计 |
| `kpl2k-start` | 成功创建赛季模拟会话，或全明星对局计算成功 |
| `kpl2k-complete` | 赛季模拟完成，或全明星对局计算成功 |
| `guessing-start` | 进入可玩的弗一把局，或开始 KPL 天才问答 |
| `guessing-complete` | 弗一把猜中、用尽机会或查看答案后结束；KPL 天才确认猜中 |
| `guessing-restart` | 弗一把点击再来一局，或 KPL 天才点击再想一个人物 |
| `link-start` | 成功生成新题，包括下一题 |
| `link-complete` | 当前题首次提交最短有效路径 |
| `link-reveal` | 当前题首次查看答案 |
| `link-restart` | 已有题目后切换难度或点击下一题 |
| `merge-start` | 成功建立可玩的新局，包括用户重开 |
| `merge-favorite` | 当前局首次合成 L7 本命战队；继续合成后再次达成不重复计数 |
| `merge-restart` | 用户点击游戏内或本命弹窗的重开按钮，成功建立新局；同时产生一次 `merge-start` |
| `merge-gameover` | 物理状态进入真正的 `over`，每局一次；本命弹窗、暂停、返回选队和退出不算终局 |
| `source-bilibili`、`source-xiaohongshu`、`source-zhihu`、`source-wechat` | 页面 URL 的 `utm_source` 精确匹配对应值 |
| `source-other` | 页面 URL 存在其他 `utm_source` 值，包括空值 |

可使用 `https://kplgame.cn/?utm_source=bilibili` 等链接。来源值只经固定白名单映射，原始值不进入事件 URL。没有 `utm_source` 时不发送来源事件。来源事件代表带参数的页面访问，不保证一次跨页面会话只计一次。

## 人工计算

- Portal → Link 点击率 = `portal-click-link / pageview-portal`
- Link 开局率 = `link-start / pageview-link`
- Link 完成率 = `link-complete / link-start`
- Guessing 完成率 = `guessing-complete / guessing-start`
- 2K 完成率 = `kpl2k-complete / kpl2k-start`

这些比率按事件次数计算。游戏可以在同一页面开始多局，完成事件也可能对应此前已开始的局，因此不能当作严格用户漏斗或独立人数转化率。

A1 的 Link 完成与查看答案标记按逻辑题目保存，清空中间选手、删除或重新提交不会清除；成功生成下一题或切换难度的新题才清除。Merge 的开发固定场景与 BFCache 重建不产生业务事件。恢复后重建的局保持静默，用户显式重新开局才恢复计数。

本地周报使用可选 `mergeAnalyticsStartedAt` 标记六类 Merge 事件正式生效时间。需待部署后取得云端接收证据再填写带时区的 ISO 时间；缺少此时间或统计窗口早于生效时间时，相关数据为未知，不能填零。跨上线时间的周标记为部分覆盖，不能视为完整一周的表现。A1 没有增加会话或局标识。

普通 L7 Total Requests、`/`、`/kpl2k/`、`/guessing/`、`/link/`、`/release-meta.json`、JS、CSS、JSON、图片和音频请求均不能视为真人 PV，其中包含浏览器资源加载与运维流量。真人页面打开只看 `pageview-*`；游戏行为只看相应事件路径。production smoke 不请求 `/__event/*`。
