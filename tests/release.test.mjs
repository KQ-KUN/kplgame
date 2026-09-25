import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForProduction} from '../scripts/wait-production.mjs';
import {pageResources,smokeProduction} from '../scripts/smoke-production.mjs';
import {auditHtml,auditScript,auditStylesheet} from '../scripts/runtime-security.mjs';

const sha='a'.repeat(40);
test('production wait accepts only the requested commit and times out on stale deploy',async()=>{
  let count=0;
  const fetcher=async()=>({ok:true,json:async()=>({schemaVersion:1,platformCommit:++count===2?sha:'b'.repeat(40)})});
  assert.equal((await waitForProduction(sha,{fetcher,sleep:async()=>{},now:()=>0})).platformCommit,sha);
  await assert.rejects(waitForProduction(sha,{fetcher:async()=>({ok:false,status:404}),sleep:async()=>{},now:()=>1,timeoutMs:0}),/超时/);
});

test('security audit blocks unknown scripts, frames, mixed content and unknown image origins',()=>{
  const context={pageURL:'https://example.test/link/',owner:'link',origin:'https://example.test'};
  assert.equal(auditHtml('<script src="https://evil.test/x.js"></script>',context).length,1);
  assert.equal(auditHtml('<iframe src="https://example.test/embed"></iframe>',context).length,1);
  assert.ok(auditHtml('<img src="http://example.test/a.png">',context).some(error=>error.includes('非 HTTPS')));
  assert.ok(auditHtml('<img src="https://evil.test/a.png">',context).some(error=>error.includes('未允许')));
  assert.deepEqual(auditHtml('<img src="https://smobatv-pic.tga.qq.com/a.png">',{...context,owner:'kpl2k'}),[]);
  assert.ok(auditStylesheet('body{background:url(http://example.test/a.png)}',context).length);
  assert.ok(auditScript('fetch("http://example.test/data.json")',context).length);
  assert.ok(auditScript('document.createElement("script")',context).length);
});

test('production smoke fails when a page adds an unknown third-party script',async()=>{
  const fetcher=async()=>({status:200,text:async()=>'<html><script src="https://evil.test/a.js"></script></html>'});
  await assert.rejects(smokeProduction({origin:'https://example.test',games:[],fetcher}),/未允许 script/);
});

test('production smoke checks every entry and critical assets; favicon is warning',async()=>{
  const html='<html><link rel="stylesheet" href="./style.css"><script src="./app.js"></script><link rel="icon" href="./favicon.ico"></html>';
  const seen=[];
  const fetcher=async url=>{
    const pathname=new URL(url).pathname;
    seen.push(pathname);
    if(pathname.endsWith('favicon.ico')) return {status:404};
    if(pathname.endsWith('app.js')) return {status:200,text:async()=>"fetch('./data.json')"};
    return {status:200,text:async()=>html};
  };
  const result=await smokeProduction({origin:'https://example.test',games:[{path:'/link/'}],fetcher});
  assert.equal(result.ok,true);
  assert.equal(result.warnings.length,2);
  assert.ok(seen.includes('/link/data.json'));
  assert.deepEqual(pageResources('<link href="/x.css"><script src="https://other.test/x.js"></script>','https://example.test/link/'),['https://example.test/x.css']);
  await assert.rejects(smokeProduction({origin:'https://example.test',games:[{path:'/link/'}],fetcher:async url=>({status:new URL(url).pathname==='/link/'?404:200,text:async()=>html})}),/smoke 失败/);
});
