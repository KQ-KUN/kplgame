import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForProduction} from '../scripts/wait-production.mjs';
import {pageResources,smokeProduction} from '../scripts/smoke-production.mjs';

const sha='a'.repeat(40);
test('production wait accepts only the requested commit and times out on stale deploy',async()=>{
  let count=0;
  const fetcher=async()=>({ok:true,json:async()=>({schemaVersion:1,platformCommit:++count===2?sha:'b'.repeat(40)})});
  assert.equal((await waitForProduction(sha,{fetcher,sleep:async()=>{},now:()=>0})).platformCommit,sha);
  await assert.rejects(waitForProduction(sha,{fetcher:async()=>({ok:false,status:404}),sleep:async()=>{},now:()=>1,timeoutMs:0}),/超时/);
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
