import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coinEvents,eventNames} from '../scripts/analytics-events.mjs';
test('Coin contract covers page, entry, start, completion, replay and resume',()=>{
  assert.equal(coinEvents.length,10);
  for(const name of ['pageview-coin','portal-click-coin','coin-start','coin-complete','coin-restart','coin-resume'])assert.ok(eventNames.includes(name));
});
