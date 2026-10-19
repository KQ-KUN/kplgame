import {pathToFileURL} from 'node:url';
import {registry} from './common.mjs';
import {auditHtml,auditScript,auditStylesheet,expectedHeaders} from './runtime-security.mjs';
import {smokeContracts,validateContract,scriptDependencies,matchesBinarySignature} from './smoke-contracts.mjs';

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
  const resourceCache=new Map();
  async function resource(url,owner,pageURL,validator,moduleURL=pageURL) {
    const reference=new URL(url,moduleURL).href;
    if(new URL(reference).origin!==new URL(origin).origin) throw new Error(`关键资源必须同源: ${reference}`);
    let promise=resourceCache.get(reference);
    if(!promise) {
      promise=(async()=>{
        const response=await safeFetch(reference,{cache:'no-store',signal:AbortSignal.timeout(15_000)});
        if(response.status!==200) throw new Error(`${reference}: HTTP ${response.status}`);
        const body=await response.text();
        if(/^\s*(?:<!doctype|<html\b)/i.test(body) || response.headers?.get('content-type')?.includes('text/html')) throw new Error(`${reference}: 关键资源返回 HTML`);
        checked.push(reference);
        return body;
      })();
      resourceCache.set(reference,promise);
    }
    const body=await promise,pathname=new URL(reference).pathname;
    if(pathname.endsWith('.json')) {
      let data;
      try {data=JSON.parse(body);} catch {throw new Error(`${reference}: 无效 JSON`);}
      if(validator && !validator(data)) throw new Error(`${reference}: 数据结构不符合契约`);
      return data;
    }
    if(pathname.endsWith('.css')) failures.push(...auditStylesheet(body,{pageURL:reference,owner,origin}));
    if(/\.m?js$/.test(pathname)) {
      failures.push(...auditScript(body,{pageURL:reference,owner,origin}));
      // Fetch dependencies before returning, with a visited set to break cycles.
      if(!visited.has(reference)) {
        visited.add(reference);
        for(const child of scriptDependencies(body)) await resource(child,owner,pageURL,undefined,reference);
        for(const match of body.matchAll(/fetch\(\s*["'`]([^"'`]+\.json(?:\?[^"'`]*)?)["'`]/g)) await resource(match[1],owner,pageURL);
      }
    }
    return body;
  }
  const visited=new Set();
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
    const resources=pageResources(html,pageURL);
    failures.push(...validateContract(owner,html,resources,pageURL));
    if(checkHeaders) for(const [key,value] of Object.entries(expectedHeaders)) {
      if(key==='strict-transport-security' && origin!==productionOrigin) continue;
      if(response.headers?.get(key)!==value) failures.push(`${page}: ${key} 响应头与基线不一致`);
    }
    for(const reference of resources) {
      try {
        await resource(reference,owner,pageURL);
      } catch(error) { failures.push(error.message); }
    }
    const data=new Map();
    for(const [reference,validator] of smokeContracts[owner]?.data??[]) {
      try {data.set(reference,await resource(reference,owner,pageURL,validator));}
      catch(error) {failures.push(error.message);}
    }
    for(const [reference,signature] of smokeContracts[owner]?.assets??[]) {
      try {
        const url=new URL(reference,pageURL);
        const response=await safeFetch(url,{cache:'no-store',signal:AbortSignal.timeout(15_000)});
        if(response.status!==200) throw new Error(`${url}: HTTP ${response.status}`);
        const bytes=new Uint8Array(await response.arrayBuffer());
        if(!matchesBinarySignature(bytes,signature) || response.headers?.get('content-type')?.includes('text/html')) throw new Error(`${url}: 资源内容不符合契约`);
        checked.push(url.href);
      } catch(error) {failures.push(error.message);}
    }
    // Sample an actual shard selected from the manifest/base, never a guessed ID.
    if(owner==='kpl2k') {
      const team=data.get('data/base.json')?.franchises?.[0]?.id;
      const season=data.get('data/manifest.json')?.seasons?.[0]?.season_id;
      for(const [reference,validator] of [
        [team && `data/teams/${team}.json`,d=>Array.isArray(d.players) && d.players.length>0],
        [season && `data/seasons/${season}.json`,d=>d.season_id===season && Array.isArray(d.rosters) && d.rosters.length>0 && Array.isArray(d.rounds)]
      ]) if(reference) try {await resource(reference,owner,pageURL,validator);} catch(error) {failures.push(error.message);}
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
