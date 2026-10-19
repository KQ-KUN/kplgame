import {test} from 'node:test';
import assert from 'node:assert/strict';
import {smokeProduction} from '../scripts/smoke-production.mjs';
import {validateContract,scriptDependencies,smokeContracts,matchesBinarySignature} from '../scripts/smoke-contracts.mjs';
import {mockSite,portalHTML,linkHTML} from './fixtures/smoke-site.mjs';
const games=[{id:'link',path:'/link/'}];
test('binary image and audio contracts reject fallback HTML regardless of MIME',()=>{
  for(const [,signature] of smokeContracts.merge.assets) assert.equal(matchesBinarySignature(new TextEncoder().encode('<html>fallback</html>'),signature),false);
  assert.equal(matchesBinarySignature(Uint8Array.from([0,0,0,32,102,116,121,112]),smokeContracts.merge.assets[1][1]),true);
});
test('every currently enabled game has an explicit contract',()=>{
  for(const id of ['kpl2k','guessing','link','coin']) assert.ok(smokeContracts[id].data.length>0);
  assert.ok(smokeContracts.merge.bundled && smokeContracts.merge.assets.length>0);
});
test('HTTP 200 fallback portal at game entry is rejected',async()=>{
  await assert.rejects(smokeProduction({origin:'https://example.test',games,fetcher:mockSite({'/link/':portalHTML}).fetcher}),/入口识别标记/);
});
test('HTML posing as JSON and wrong JSON structure are rejected',async()=>{
  for(const bad of [portalHTML,'{"players":[]}']) {
    await assert.rejects(smokeProduction({origin:'https://example.test',games,fetcher:mockSite({'/link/data/players.json':bad}).fetcher}),/返回 HTML|数据结构/);
  }
});
test('missing imported module or HTML posing as JS fails',async()=>{
  for(const bad of [undefined,portalHTML]) await assert.rejects(smokeProduction({origin:'https://example.test',games,fetcher:mockSite({'/link/assets/chunk.js':bad}).fetcher}),/HTTP 404|返回 HTML/);
});
test('entry without a primary module or omitted core script fails',()=>{
  assert.ok(validateContract('link',linkHTML.replace('type="module"',''),[],'https://example.test/link/').length);
  assert.ok(validateContract('kpl2k','<button id="btn-classic"></button><div id="team"></div>',[],'https://example.test/kpl2k/').some(x=>x.includes('js/engine.js')));
  assert.deepEqual(scriptDependencies('import{a}from"./a.js";import("./b.js");'),['./a.js','./b.js']);
  assert.deepEqual(validateContract('portal',portalHTML,['https://example.test/portal.js?v=123'],'https://example.test/'),[]);
});
test('nested module imports use module URL while nested fetch uses document URL',async()=>{
  const f=mockSite({'/link/assets/chunk.js':'import "./nested.js";fetch("./data/players.json")','/link/assets/nested.js':'export const ready=true;'});
  await smokeProduction({origin:'https://example.test',games,fetcher:f.fetcher});
  assert.ok(f.seen.includes('/link/assets/nested.js'));
  assert.ok(f.seen.includes('/link/data/players.json'));
  assert.ok(!f.seen.includes('/link/assets/data/players.json'));
});
test('imported script event requests cannot escape telemetry barrier',async()=>{
  const f=mockSite({'/link/assets/chunk.js':'fetch("/__event/fake.json")'});
  await assert.rejects(smokeProduction({origin:'https://example.test',games,fetcher:f.fetcher}),/禁止请求产品统计事件/);
  assert.ok(f.seen.every(url=>!url.startsWith('/__event/')));
});
