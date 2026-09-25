import fs from 'node:fs/promises';
import path from 'node:path';
import {root,dist,files,registry} from './common.mjs';
import {auditHtml,auditScript,auditStylesheet,expectedHeaders} from './runtime-security.mjs';

export function resolveAsset(base, reference, output=dist) {
  if (!reference || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) return null;
  const raw=decodeURIComponent(reference.split(/[?#]/)[0]);
  if (!raw) return null;
  const target=path.resolve(raw.startsWith('/') ? output : path.dirname(base),raw.replace(/^\//,''));
  if(target!==output && !target.startsWith(output+path.sep)) throw new Error(`资源路径越界: ${reference}`);
  return target;
}

export async function validate(output=dist) {
  const games=(await registry()).filter(g=>g.enabled);
  const all=await files(output);
  const errors=[], external=new Set();
  for(const key of ['content-security-policy','x-content-type-options','referrer-policy','permissions-policy','strict-transport-security']) {
    if(!expectedHeaders[key]) errors.push(`缺少安全响应头: ${key}`);
  }
  const forbidden=/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)/i;
  const totals={portal:{},...Object.fromEntries(games.map(g=>[g.id,{}]))};
  const resources=[];
  async function check(file,ref) {
    if (/\$\{|[<>]/.test(ref)) return;
    let target;
    try {target=resolveAsset(file,ref,output);} catch(e) {errors.push(e.message);return;}
    if(!target) return;
    let info=await fs.stat(target).catch(()=>null);
    if(info?.isDirectory()) info=await fs.stat(path.join(target,'index.html')).catch(()=>null);
    if(!info?.isFile()) errors.push(`${path.relative(output,file)} -> ${ref}`);
  }
  for(const g of games) {
    const base=path.resolve(output,g.path.slice(1));
    if(!all.includes(path.join(base,'index.html'))) errors.push(`缺少 ${g.path}index.html`);
    for(const ext of ['.js','.css']) if(!all.some(f=>f.startsWith(base+path.sep)&&f.endsWith(ext))) errors.push(`${g.id} 缺少 ${ext}`);
  }
  if(!all.includes(path.join(output,'index.html'))) errors.push('缺少 Portal index.html');
  for(const file of all) {
    const rel=path.relative(output,file).split(path.sep).join('/');
    const ext=path.extname(file).toLowerCase();
    const bytes=(await fs.stat(file)).size;
    const owner=games.find(g=>rel.startsWith(g.path.slice(1)))?.id || 'portal';
    const category=ext==='.js'?'JS':ext==='.css'?'CSS':ext==='.json'?'JSON':/\.(png|jpg|jpeg|webp|avif|svg|gif)$/.test(ext)?'Images':'Other';
    totals[owner][category]=(totals[owner][category]||0)+bytes;
    resources.push({path:rel,bytes});
    if(!['.html','.css','.js','.json'].includes(ext)) continue;
    const text=await fs.readFile(file,'utf8');
    const pageURL=new URL(rel,'https://kplgame.cn/').href;
    const security={pageURL,owner,origin:'https://kplgame.cn'};
    if(ext==='.html') errors.push(...auditHtml(text,security).map(error=>`${rel}: ${error}`));
    if(ext==='.css') errors.push(...auditStylesheet(text,security).map(error=>`${rel}: ${error}`));
    if(ext==='.js') errors.push(...auditScript(text,security).map(error=>`${rel}: ${error}`));
    if(ext!=='.json' && forbidden.test(text)) errors.push(`${rel}: 禁用运行 CDN`);
    for(const match of text.matchAll(/https?:\/\/[^\s"'<>\\)]+/g)) external.add(match[0]);
    if(ext==='.html') {
      for(const m of text.matchAll(/(?:src|href|poster)\s*=\s*["']([^"']+)["']/g)) await check(file,m[1]);
    }
    if(ext==='.css' || ext==='.html') for(const m of text.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) await check(file,m[1]);
    if(ext==='.js') {
      for(const m of text.matchAll(/(?:import\s*\(|from\s*|import\s*)["'](\.[^"']+)["']/g)) await check(file,m[1]);
      // Literal fetch is document-relative. Dynamic paths require browser acceptance.
      const game=games.find(g=>rel.startsWith(g.path.slice(1)));
      const document=path.join(output,game?.path.slice(1)||'', 'index.html');
      for(const m of text.matchAll(/fetch\(\s*["']([^"']+)["']\s*[,)]/g)) await check(document,m[1]);
    }
    if(ext==='.json') {
      let data;
      try{data=JSON.parse(text);}catch{errors.push(`${rel}: 无效 JSON`);continue;}
      const game=games.find(g=>rel.startsWith(g.path.slice(1)));
      const document=path.join(output,game?.path.slice(1)||'', 'index.html');
      const walk=async value=>{
        if(typeof value==='string' && /^(?:\.\/)?assets\/[^\s]+\.(?:webp|png|jpg|jpeg|svg|avif|mp3|ogg)$/i.test(value)) await check(document,value);
        else if(value && typeof value==='object') for(const v of Object.values(value)) await walk(v);
      };
      await walk(data);
    }
  }
  const html=await fs.readFile(path.join(output,'index.html'),'utf8');
  if(/<(?:script|link)[^>]*(?:kpl2k|guessing)\/(?:data|assets)/i.test(html)) errors.push('Portal 预加载游戏数据');
  const firstScreen=new Set(['index.html']);
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const p=resolveAsset(path.join(output,'index.html'),m[1],output);
    if(p && /\.(css|js|png|webp|avif|svg|ico)$/.test(p)) firstScreen.add(path.relative(output,p).split(path.sep).join('/'));
  }
  const report={totals,portalFirstScreenBytes:resources.filter(r=>firstScreen.has(r.path)).reduce((a,r)=>a+r.bytes,0),largest10:resources.sort((a,b)=>b.bytes-a.bytes).slice(0,10),externalURLs:[...external].sort(),errors:[...new Set(errors)],limitations:['动态构造 fetch/url/worker 必须浏览器网络验收','externalURLs 包含来源引用、普通链接与可选统计，不全是运行依赖']};
  await fs.mkdir(path.join(root,'reports'),{recursive:true});
  await fs.writeFile(path.join(root,'reports/build-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({totals,portalFirstScreenBytes:report.portalFirstScreenBytes,largest10:report.largest10,errorCount:report.errors.length},null,2));
  if(report.errors.length) throw new Error(report.errors.slice(0,30).join('\n'));
  return report;
}
if(!process.env.KPL_VALIDATOR_IMPORT_ONLY) await validate();
