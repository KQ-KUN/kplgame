# 消费快照共同契约 v1

每个启用游戏提供 schemaVersion=1、完整40位 sourceCommit、inputs[{path,sha256}]、outputs[{path,sha256,bytes}]、UTC generatedAt、coverage、exclusionRules、generator{name,version}。generator.version可为生成器SHA256。output路径以本仓库根相对定位；Coin ledger最终.js对应sourcePath .mjs原字节。manifest不包含自身hash。consumer:前缀表示输入为已有消费快照，并不声称原始抓取证据齐全；跨来源输入必须注明各自sourceCommit。构建只验证，不隐式同步。

最终头像缓存/路径重写完成后再生成outputs与质量报告。原始远程引用数量、最终本地引用与独立资源数分别报告。图鉴档案701条不等于701个人，按base人物ID计数为448；历史队名/昵称不能作为合并键。身份、队伍、赛季与别名映射由实际来源ID和显式覆盖检查，缺证保留冲突清单。

null表示未知或不适用；缺失字段按schema处理，不能自动补零。空串不能作为有效ID；0只有核验/完整标志允许时才是确定零。冠军未核验、队伍数不完整继续按第一批纯函数语义返回未知/下界，不作为确定排除条件。比例在各游戏semantics明确单位，Coin概率为0..1、倍率为含本金倍数，金额只由唯一ledger。

来源层级不可混淆：2K canonical及派生资源、Guessing已有consumer snapshot与未核验职员事实、Link冻结关系证据、Merge原始音频和转码输出、Coin冻结模型输入均不同。新manifest时间说明生成时间，不表示更新了赛事事实。无可靠来源不能用昵称猜身份或为提高完整率填值。

位置：2K app/data/consumption-manifest.json；Guessing public/data/snapshot_manifest.json；Link/Merge public/data/manifest.json；Coin data/consumption-manifest.json。平台npm run validate:data严格核验完整字段、最终输出内容与大小，详情在reports/snapshot-contracts.json。原始input有专属来源URI时由对应维护命令验证，不允许把URI当本地路径读取。旧锁定ref无共同manifest标legacy-unverified。
