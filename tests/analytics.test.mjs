import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {eventNames,writeEventFiles} from '../scripts/analytics-events.mjs';
import {expectedHeaders} from '../scripts/runtime-security.mjs';
import {pageResources,smokeProduction} from '../scripts/smoke-production.mjs';

const script=await fs.readFile(new URL('../public/shared/analytics.js',import.meta.url),'utf8');
function load(path='/',search='',{webdriver=false,fetcher=()=>Promise.resolve()}={}) {
  const calls=[];
  const listeners=new Map();
  const window={};
  const context={window,location:{pathname:path,search},navigator:{webdriver},
    fetch:(url,options)=>{calls.push({url,options});return fetcher(url,options);},
    document:{addEventListener:(type,listener)=>listeners.set(type,listener)},
    Element:class Element {},URLSearchParams,Promise,Set,Object};
  vm.runInNewContext(script,context);
  return {calls,listeners,window,context};
}

test('all fixed events have one endpoint name and helper permits exactly those names',()=>{
  assert.equal(new Set(eventNames).size,eventNames.length);
  const {window,calls}=load();
  for(const event of eventNames) assert.equal(window.KPLAnalytics.trackEvent(event),true);
  assert.equal(window.KPLAnalytics.trackEvent('../secret?player=abc'),false);
  assert.equal(window.KPLAnalytics.trackEvent('source-bilibili?user=abc'),false);
  assert.deepEqual(calls.slice(1).map(call=>call.url),eventNames.map(event=>`/__event/${event}.txt`));
  assert.ok(calls.every(call=>call.options.credentials==='omit' && call.options.referrerPolicy==='no-referrer' && call.options.keepalive===true));
});

test('build writes every fixed endpoint with only ok content',async()=>{
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'kpl-analytics-'));
  try {
    await writeEventFiles(output);
    const names=(await fs.readdir(path.join(output,'__event'))).sort();
    assert.deepEqual(names,eventNames.map(name=>`${name}.txt`).sort());
    for(const name of names) assert.equal(await fs.readFile(path.join(output,'__event',name),'utf8'),'ok\n');
  } finally { await fs.rm(output,{recursive:true,force:true}); }
});

test('pageview is once per document and webdriver sends nothing',()=>{
  for(const [path,name] of [['/','portal'],['/kpl2k/','kpl2k'],['/guessing/','guessing'],['/link/','link']]) {
    const page=load(path);
    assert.deepEqual(page.calls.map(call=>call.url),[`/__event/pageview-${name}.txt`]);
    assert.equal(page.window.KPLAnalytics.trackPageView(name),false);
  }
  const run=load('/link/');
  assert.deepEqual(run.calls.map(call=>call.url),['/__event/pageview-link.txt']);
  assert.equal(run.window.KPLAnalytics.trackPageView('link'),false);
  vm.runInNewContext(script,run.context);
  assert.equal(run.calls.length,1);
  const bot=load('/link/','?utm_source=bilibili',{webdriver:true});
  bot.window.KPLAnalytics.trackEvent('link-start');
  assert.equal(bot.calls.length,0);
});

test('source values are mapped to fixed events and never appear in request options',()=>{
  for(const [source,event] of [['bilibili','source-bilibili'],['xiaohongshu','source-xiaohongshu'],['zhihu','source-zhihu'],['wechat','source-wechat'],['private@example.com','source-other']]) {
    const run=load('/guessing/',`?utm_source=${encodeURIComponent(source)}`);
    assert.equal(run.calls[1].url,`/__event/${event}.txt`);
    assert.equal(JSON.stringify(run.calls).includes(source),source===event.slice(7));
  }
  assert.equal(load('/').calls.length,1);
});

test('failed analytics never blocks caller and Portal card click retains navigation',async()=>{
  const run=load('/', '', {fetcher:()=>{throw new Error('offline');}});
  assert.equal(run.window.KPLAnalytics.trackEvent('link-start'),true);
  const rejected=load('/', '', {fetcher:()=>Promise.reject(new Error('offline'))});
  assert.equal(rejected.window.KPLAnalytics.trackEvent('link-start'),true);
  await Promise.resolve();
  const card=new run.context.Element();
  card.closest=()=>({getAttribute:()=> 'link'});
  run.listeners.get('click')({target:card});
  assert.equal(run.calls.at(-1).url,'/__event/portal-click-link.txt');
  assert.ok(!script.includes('preventDefault'));
});

test('production smoke never requests event paths and CSP stays same-origin',async()=>{
  const seen=[];
  await smokeProduction({origin:'https://example.test',games:[],fetcher:async url=>{
    seen.push(new URL(url).pathname);
    return {status:200,text:async()=>'<html><script src="/shared/analytics.js"></script></html>'};
  }});
  assert.ok(seen.every(path=>!path.startsWith('/__event/')));
  assert.equal(pageResources('<script src="/__event/pageview-link.txt"></script>','https://example.test/').length,0);
  assert.equal(expectedHeaders['content-security-policy'].split(';').map(part=>part.trim()).find(part=>part.startsWith('connect-src ')),"connect-src 'self'");
});
