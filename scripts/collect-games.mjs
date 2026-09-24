import fs from 'node:fs/promises';
import path from 'node:path';
import {root,dist,registry,sourceFor,readJSON,escapeHTML as e,run,inside} from './common.mjs';

const games=(await registry()).filter(g=>g.enabled);
const site=await readJSON(path.join(root,'config/site.json'));
const ads=await readJSON(path.join(root,'config/ads.json'));
if(ads.enabled!==false) throw new Error('当前仅支持关闭广告，启用需独立实现与审核');
const sources=await Promise.all(games.map(async g=>({g,source:await sourceFor(g)})));
for(const {g,source} of sources) await fs.access(path.join(inside(source,g.build.output),'index.html'));
// Only remove the fixed generated directory, never a configured source directory.
if(dist!==path.join(root,'dist')) throw new Error('输出保护失败');
await fs.rm(dist,{recursive:true,force:true});
await fs.cp(path.join(root,'portal'),dist,{recursive:true});
await fs.cp(path.join(root,'public'),dist,{recursive:true});
const cards=games.map(g=>`<a class="game-card game-card--${g.accent}" href="${e(g.path)}?theme=light"><span class="card-glow" aria-hidden="true"></span><span class="avatar-wrap"><img src="/${e(g.icon)}" alt="" width="82" height="82"></span><span class="card-copy"><span class="game-type">${e(g.category)}</span><strong>${e(g.name)}</strong><span class="game-desc">${e(g.description)}</span></span><span class="enter">进入游戏 <b aria-hidden="true">→</b></span></a>`).join('\n');
let html=await fs.readFile(path.join(dist,'index.html'),'utf8');
for(const [key,value] of Object.entries({name:site.name,title:site.title,description:site.description,disclaimer:site.disclaimer})) html=html.replaceAll(`{{${key}}}`,e(value));
html=html.replace('{{games}}',cards);
await fs.writeFile(path.join(dist,'index.html'),html);
const manifest=[];
for(const {g,source} of sources) {
  const dest=inside(dist,g.path.slice(1));
  await fs.cp(inside(source,g.build.output),dest,{recursive:true});
  let index=await fs.readFile(path.join(dest,'index.html'),'utf8');
  // Temporary adapter for legacy releases; fail if upstream navigation changes.
  const link=/<a\b(?=[^>]*class="[^"]*\bsister-link\b)[^>]*>[\s\S]*?<\/a>/g;
  const matches=[...index.matchAll(link)];
  if(matches.length===1) index=index.replace(link,'<a class="sister-link" href="/" aria-label="返回 KPL GAME">← 游戏中心</a>');
  else if(!/href="\/"[^>]*>[^<]*.*游戏中心/.test(index)) throw new Error(`${g.id} 需要返回 Hub 导航，旧适配器未匹配`);
  index=index.replace(/<a\b[^>]*href="https:\/\/kpl2k-kpl2k-d0gigrx6e89914f65\.webapps\.tcloudbase\.com\/?"[^>]*>[\s\S]*?<\/a>/g,'<a href="/">← 游戏中心</a>');
  await fs.writeFile(path.join(dest,'index.html'),index);
  const actual=run('git',['rev-parse','HEAD'],source,true);
  const dirty=Boolean(run('git',['status','--porcelain','--untracked-files=no'],source,true));
  if(process.env.CI && (actual!==g.ref || dirty)) throw new Error(`${g.id} CI 源码与锁定版本不一致`);
  manifest.push({id:g.id,repo:g.repo,expectedRef:g.ref,actualRef:actual,dirty,navigationAdapter:matches.length===1});
}
await fs.mkdir(path.join(root,'reports'),{recursive:true});
await fs.writeFile(path.join(root,'reports/build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const platformCommit=run('git',['rev-parse','HEAD'],root,true);
if(!/^[a-f0-9]{40}$/.test(platformCommit)) throw new Error('无法读取平台 commit');
await fs.writeFile(path.join(dist,'release-meta.json'),JSON.stringify({schemaVersion:1,platformCommit,games:Object.fromEntries(games.map(g=>[g.id,g.ref]))},null,2)+'\n');
console.log(`已收集 ${games.length} 个独立游戏到 dist/`);
