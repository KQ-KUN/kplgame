import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {registry} from '../scripts/common.mjs';
import {renderGames} from '../scripts/portal-view.mjs';

test('Merge is a pinned fourth game with a Chinese entry and local icon',async()=>{
  const games=await registry();
  const enabled=games.filter(game=>game.enabled);
  assert.deepEqual(enabled.slice(0,4).map(game=>game.id),['kpl2k','guessing','link','merge']);
  const merge=enabled.find(game=>game.id==='merge');
  assert.equal(merge.repo,'KQ-KUN/kpl-merge');
  assert.equal(merge.path,'/merge/');
  assert.match(merge.ref,/^[a-f0-9]{40}$/);
  const html=renderGames(games);
  assert.match(html,/data-game="merge" href="\/merge\/"/);
  assert.match(html,/<strong>合成KPL<\/strong>/);
  assert.equal((html.match(/class="game-card /g)||[]).length,enabled.length);
  assert.match(await fs.readFile(new URL(`../public/${merge.icon}`,import.meta.url),'utf8'),/<svg /);
});
