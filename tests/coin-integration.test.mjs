import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {registry} from '../scripts/common.mjs';
import {renderGames} from '../scripts/portal-view.mjs';
import {eventNames} from '../scripts/analytics-events.mjs';

test('Coin is independently pinned at /coin/ with one local Portal entry',async()=>{
  const games=await registry(),coin=games.find(g=>g.id==='coin');
  assert.equal(coin.enabled,true);assert.equal(coin.repo,'KQ-KUN/kpl-coin');assert.equal(coin.path,'/coin/');
  assert.match(coin.ref,/^[a-f0-9]{40}$/);assert.equal(coin.build.type,'npm');assert.equal(coin.build.output,'dist');
  assert.deepEqual(coin.build.test,['npm','test']);
  const html=renderGames(games);assert.equal((html.match(/data-game="coin" href="\/coin\/"/g)||[]).length,1);
  assert.match(await fs.readFile(new URL(`../public/${coin.icon}`,import.meta.url),'utf8'),/<svg /);
});

test('Coin aliases revalidate cache with approved fixed product event endpoints',async()=>{
  const config=JSON.parse(await fs.readFile(new URL('../edgeone.json',import.meta.url)));
  const rule=config.headers.find(r=>r.source==='/coin/*');
  assert.ok(rule.headers.some(h=>h.key==='Cache-Control'&&h.value==='public, max-age=0, must-revalidate'));
  for(const source of ['/coin','/coin/index.html']){
    assert.ok(config.redirects.some(r=>r.source===source&&r.destination==='/coin/'&&r.statusCode===302));
  }
  for(const name of ['pageview-coin','portal-click-coin','coin-start','coin-complete','coin-restart','coin-resume'])assert.ok(eventNames.includes(name));
});
