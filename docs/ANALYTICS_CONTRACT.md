# 统计接入契约

共享 helper 现覆盖 Portal、2K、Guessing、Link、Merge、Coin。eventNames 与静态 __event/*.txt 必须一致；聚合构建执行 validateAnalytics，检查每个启用游戏的页面、入口、必要行为、helper 注入和 Coin 产品开关。新游戏需声明自己的必要行为并通过本地浏览器验收。

Coin 保留六个既有事件名，增加 coin-restart 和 coin-resume，以及 pageview-coin / portal-click-coin。start 表示成功创建新回放；明确重玩同时发送 start 和 restart。resume 只表示成功恢复，不新增 start。complete 和 recap 的去重标志随存档恢复，已完成存档恢复不重复完成。copy 为点击复制操作，不表示剪贴板成功。金额、战队、身份、存档内容不上传。

所有统计为事件次数，不等于 UV、独立玩家或会话转化率。PV 按 document 去重；恢复页面的新 document 可有 PV。来源读取固定 UTM allowlist，不上传任意参数。navigator.webdriver=true 禁止上报；浏览器测试只在 localhost 使用替身并阻断生产事件路径。统计失败不影响游戏。

统计启用候选需与 Coin 独立源码和平台一起发布。云端实际生效时间必须根据正式版本和接收证据记录；未核实前周报保持 unknown，历史未采集不能填零。HTTP 页面请求单独列示，包含刷新、爬虫及失败请求，不替代 PV 或玩家数。
