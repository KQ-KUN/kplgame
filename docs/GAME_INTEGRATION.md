# 游戏接入协议

每个游戏独立仓库、独立业务源码、独立测试；统一输出目录默认 `dist/`。Vite 使用 `base: './'` 或注册表对应子路径，所有 CSS url、JSON fetch、字体、音频、favicon、dynamic import、worker 都须在子路径中有效。静态多页面使用真实文件，不用将所有 404 重写成 Portal。

`config/games.json` 是唯一注册表。启用项必须有 id、name、repo、40 位 ref commit、path、category、description、accent、icon、enabled、build。build.type 为 npm 或 static，output 是游戏仓库内路径，test 为命令参数数组。ref 锁定真实 GitHub commit，升级需更新 ref 并重新验收。禁用项不拉取、不构建、不出卡片。Link 已按远端提交锁定并启用；Timeline、Grid、Draft、Lineup 仍禁用。

## 从零构建

Node.js 24、npm、Git 即可；平台本身零 npm 依赖。

```sh
npm run checkout
npm run install:games
npm test
npm run build
npm run serve
```

checkout 根据启用注册项逐个克隆到忽略目录 sources/ 并锁定 ref。已有目录不会被覆盖；升级请在对应源仓库检查工作区后 fetch/checkout。脚本无个人绝对路径。CI 使用同一命令，构建结果检查实际 commit 与 dirty 状态。

本地已有 checkout 可用忽略文件 `config/local-sources.json`，例如：

```json
{"kpl2k":"../../kpl2k","guessing":"../../KPL-Guessing"}
```

路径相对平台根目录。此覆盖只用于本地，禁止入库；reports/build-manifest.json 会记录实际 ref 和 dirty，CI 不接受版本偏差。

## 既有两个游戏

KPL 2K 是无需打包器的独立静态游戏，`app/` 已包括运行所需数据和资源。平台 static adapter 复制 app，相当于其独立发布构建；不运行根 npm build（该命令仍属于旧 Hub，且会生成 Link）。独立开发可用原 `tools/serve_local.py`，独立逻辑测试 `node tools/verify_engine.js`。更新数据用原数据流水线，不能在平台发布时自动抓取。

Guessing 从 `KQ-KUN/KPL-Guessing` 拉取，独立 `npm ci`、`npm run dev`、`npm test`、`npm run build`。注意：本地兼容副本设置了 `base: './'`，正式远端没有相同设置；平台注册项通过 build.args 传入 `--base=./`，保证资源位于自身子目录。题库已在 public/data，可直接 build；重新导入时显式调用 `python tools/import_kpl2k.py --source <kpl2k>`，不要依赖其旧 package data 命令中的个人目录约定。

两个旧版本首页仍有 sister-link。平台当前只在复制产物后将该链接替换为“← 游戏中心”并指向 `/`，严格匹配一个链接，源代码不改；适配结果记录在 manifest。未来在独立游戏源码原生提供 Hub 导航后移除此兼容适配，不扩展成业务补丁系统。

## 接入与验收

新游戏先独立开发并验收，再注册启用；静态模板在构建时生成 Hub 卡片，不需要复制 HTML 或浏览器加载注册 JSON。Portal 不加载任何游戏题库/图库。

`npm run validate` 检查入口、JS/CSS存在、HTML资源、CSS url、静态 import、字面量 fetch、本地JSON图片路径、禁用 CDN、体积和最大10资源；动态 URL 和实际玩法必须另做浏览器验收。测试覆盖注册表路径冲突/越界、锁定版本、HTML 转义与子路径解析，游戏测试独立执行。

dist/、sources/、reports/ 不提交。发布包完整复制 dist，不能只上传 Portal 或某个 app 子目录。
