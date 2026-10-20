# 统计接入契约

当前helper页面白名单为portal、kpl2k、guessing、link、merge，事件名与 scripts/analytics-events.mjs 的 eventNames、静态 __event/*.txt 保持一致；测试会实际执行helper并核对全部端点。Coin页面和portal-click-coin保持关闭，属于产品开关，不是运行故障。

pageview按document去重，BFCache返回不新增；start为新局/新题/新回放的有效开始，不能在重绘或异步重试重复发送。complete为同一局/题/session首次完成；Link揭晓与正常完成分别去重，重复提交不重复完成。Guessing restart为明确重新开始；Merge restart为新局重开，gameover为终局一次；Coin未来complete/recap标志随续玩存档恢复，不能因重复恢复重发。既有事件不代表用户数、UV或留存。

Coin预备事件与src/analytics.mjs一致：coin-select-mode、coin-select-team、coin-start、coin-complete、coin-recap、coin-copy。plannedCoinEvents仅为契约，不生成端点，也不加入helper白名单。后续正式接入必须同时审核产品开关、helper页面/事件白名单、端点、语义及去重测试，并获得发布授权。仅改前端enabled=true不算完成接入。

自动化使用navigator.webdriver抑制，网络层额外阻断/__event/并要求尝试数为0；HTTP smoke禁止请求事件路径。对helper的测试使用内存fetch替身，既不访问生产也不发送真实统计。统计不可中断游戏；不带玩家身份、路径或金额参数。
