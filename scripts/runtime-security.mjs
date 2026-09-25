import {readFileSync} from 'node:fs';

const allowlist=JSON.parse(readFileSync(new URL('../config/runtime-origins.json',import.meta.url),'utf8'));
export const expectedHeaders=Object.fromEntries(JSON.parse(readFileSync(new URL('../edgeone.json',import.meta.url),'utf8')).headers[0].headers.map(({key,value})=>[key.toLowerCase(),value]));
const imagePolicy=expectedHeaders['content-security-policy']?.split(';').map(part=>part.trim()).find(part=>part.startsWith('img-src '))?.split(/\s+/)??[];
for(const origins of Object.values(allowlist)) for(const origin of origins) {
  if(!imagePolicy.includes(origin)) throw new Error(`CSP img-src 缺少运行资源白名单域名: ${origin}`);
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(([,key,double,single,bare])=>[key.toLowerCase(),double??single??bare]));
}

export function auditResource(reference,{pageURL,owner,kind,origin}) {
  const failures=[];
  if(!reference || reference.startsWith('#')) return failures;
  let url;
  try { url=new URL(reference,pageURL); }
  catch { return [`${owner}: 无效 ${kind} URL: ${reference}`]; }
  if(url.protocol==='data:' || url.protocol==='blob:') {
    if(kind!=='image') failures.push(`${owner}: ${kind} 不允许 ${url.protocol} URL`);
    return failures;
  }
  if(url.protocol!=='https:' && !(['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname) && url.protocol==='http:' && url.origin===origin)) {
    failures.push(`${owner}: 非 HTTPS ${kind}: ${reference}`);
  }
  if(kind==='iframe') failures.push(`${owner}: 未允许 iframe: ${reference}`);
  else if(url.origin!==new URL(origin).origin && !(kind==='image' && (allowlist[owner]??[]).includes(url.origin))) {
    failures.push(`${owner}: 未允许 ${kind} 域名: ${url.origin}`);
  }
  return failures;
}

export function auditHtml(html,{pageURL,owner,origin}) {
  const failures=[];
  for(const match of html.matchAll(/<(script|iframe|link|img|source|audio|video|embed|object)\b[^>]*>/gi)) {
    const tag=match[1].toLowerCase();
    const attrs=attributes(match[0]);
    if(tag==='script' && attrs.src) failures.push(...auditResource(attrs.src,{pageURL,owner,kind:'script',origin}));
    else if(tag==='iframe') failures.push(...auditResource(attrs.src||'about:blank',{pageURL,owner,kind:'iframe',origin}));
    else if(tag==='link' && /(?:^|\s)(?:stylesheet|modulepreload|preload|icon)(?:\s|$)/i.test(attrs.rel||'')) {
      const kind=attrs.rel?.includes('icon')||attrs.as==='image'?'image':attrs.as==='font'?'font':attrs.as==='script'||attrs.rel?.includes('modulepreload')?'script':'style';
      failures.push(...auditResource(attrs.href,{pageURL,owner,kind,origin}));
    } else if(['img','source','audio','video','embed','object'].includes(tag)) {
      if(tag==='embed'||tag==='object') failures.push(`${owner}: 未允许 ${tag} 元素`);
      const kind=['img','source'].includes(tag)?'image':'media';
      for(const attr of ['src','poster','data']) if(attrs[attr]) failures.push(...auditResource(attrs[attr],{pageURL,owner,kind:attr==='poster'?'image':kind,origin}));
      if(attrs.srcset) for(const candidate of attrs.srcset.split(',')) failures.push(...auditResource(candidate.trim().split(/\s+/)[0],{pageURL,owner,kind:'image',origin}));
    }
  }
  return failures;
}

export function auditStylesheet(css,{pageURL,owner,origin}) {
  const failures=[];
  for(const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)) {
    failures.push(...auditResource(match[1],{pageURL,owner,kind:/\.(?:woff2?|ttf|otf)(?:[?#]|$)/i.test(match[1])?'font':'image',origin}));
  }
  for(const match of css.matchAll(/@import\s+["']([^"']+)["']/gi)) failures.push(...auditResource(match[1],{pageURL,owner,kind:'style',origin}));
  return failures;
}

export function auditScript(js,{pageURL,owner,origin}) {
  const failures=[];
  if(/createElement\(\s*["'`](?:script|iframe)["'`]\s*\)/i.test(js)) failures.push(`${owner}: 动态创建 script/iframe 需人工核准`);
  // Only literal network loads: ordinary external navigation links are not runtime dependencies.
  for(const match of js.matchAll(/(?:fetch|importScripts|Worker|EventSource)\(\s*["'`]([^"'`]+)["'`]/g)) {
    failures.push(...auditResource(match[1],{pageURL,owner,kind:'connect',origin}));
  }
  return failures;
}
