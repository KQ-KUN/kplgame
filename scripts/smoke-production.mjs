import {pathToFileURL} from 'node:url';
import {registry} from './common.mjs';
import {auditHtml,auditScript,auditStylesheet,expectedHeaders} from './runtime-security.mjs';

export const productionOrigin='https://kplgame.cn';
const criticalExtensions=/\.(?:js|css|json)$/i;

export function pageResources(html,pageURL) {
  const urls=new Set();
  for(const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    try {
      const url=new URL(match[1],pageURL);
      if(url.origin===new URL(pageURL).origin && criticalExtensions.test(url.pathname)) urls.add(url.href);
    } catch { /* Invalid noncritical markup is handled by build validation. */ }
  }
  return [...urls];
}

export async function smokeProduction({origin=productionOrigin,games,fetcher=fetch,checkHeaders=origin===productionOrigin}={}) {
  const safeFetch=(url,options)=>{
    if(new URL(url,origin).pathname.startsWith('/__event/')) throw new Error('production smoke 禁止请求产品统计事件');
    return fetcher(url,options);
  };
  const entries=games ?? (await registry()).filter(game=>game.enabled);
  const failures=[],warnings=[],checked=[];
  const pages=[{path:'/',id:'portal'},...entries.map(game=>({path:game.path,id:game.id}))];
  for(const {path:page,id:owner} of pages) {
    const pageURL=new URL(page,origin).href;
    let response;
    try { response=await safeFetch(pageURL,{cache:'no-store',signal:AbortSignal.timeout(15_000)}); }
    catch(error) { failures.push(`${page}: ${error.message}`); continue; }
    if(response.status!==200) { failures.push(`${page}: HTTP ${response.status}`); continue; }
    const html=await response.text();
    checked.push(page);
    if(!/<html\b/i.test(html)) failures.push(`${page}: 响应不是 HTML`);
    failures.push(...auditHtml(html,{pageURL,owner,origin}));
    if(checkHeaders) for(const [key,value] of Object.entries(expectedHeaders)) {
      if(key==='strict-transport-security' && origin!==productionOrigin) continue;
      if(response.headers?.get(key)!==value) failures.push(`${page}: ${key} 响应头与基线不一致`);
    }
    for(const resource of pageResources(html,pageURL)) {
      try {
        const asset=await safeFetch(resource,{cache:'no-store',signal:AbortSignal.timeout(15_000)});
        if(asset.status!==200) failures.push(`${resource}: HTTP ${asset.status}`);
        else {
          checked.push(resource);
          const pathname=new URL(resource).pathname;
          if(pathname.endsWith('.css')) failures.push(...auditStylesheet(await asset.text(),{pageURL:resource,owner,origin}));
          // Check literal JSON loads in the page's first-party JS.
          if(pathname.endsWith('.js')) {
            const js=await asset.text();
            failures.push(...auditScript(js,{pageURL:resource,owner,origin}));
            for(const match of js.matchAll(/fetch\(\s*["'`]([^"'`]+\.json(?:\?[^"'`]*)?)["'`]/g)) {
              const jsonURL=new URL(match[1],pageURL);
              failures.push(...auditScript(`fetch("${jsonURL.href}")`,{pageURL:resource,owner,origin}));
              if(jsonURL.origin!==new URL(origin).origin) continue;
              const data=await safeFetch(jsonURL,{cache:'no-store',signal:AbortSignal.timeout(15_000)});
              if(data.status!==200) failures.push(`${jsonURL.href}: HTTP ${data.status}`);
              else checked.push(jsonURL.href);
            }
          }
        }
      } catch(error) { failures.push(`${resource}: ${error.message}`); }
    }
    for(const match of html.matchAll(/<link\b[^>]*\brel\s*=\s*["'](?:icon|shortcut icon)["'][^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
      const iconURL=new URL(match[1],pageURL);
      if(iconURL.origin!==new URL(origin).origin) continue;
      try {
        const icon=await safeFetch(iconURL,{cache:'no-store',signal:AbortSignal.timeout(15_000)});
        if(icon.status!==200) warnings.push(`${iconURL.href}: HTTP ${icon.status}`);
      } catch(error) {warnings.push(`${iconURL.href}: ${error.message}`);}
    }
  }
  const result={ok:failures.length===0,checked,failures,warnings};
  console.log(JSON.stringify(result,null,2));
  if(!result.ok) throw new Error(`生产 smoke 失败: ${failures.join('; ')}`);
  return result;
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  smokeProduction().catch(error=>{console.error(error.message);process.exitCode=1;});
}
