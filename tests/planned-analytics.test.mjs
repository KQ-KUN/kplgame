import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {plannedCoinEvents,eventNames,writeEventFiles} from '../scripts/analytics-events.mjs';
test('planned Coin events never create active endpoints',async()=>{
 assert.equal(new Set(plannedCoinEvents).size,6);
 assert.ok(plannedCoinEvents.every(event=>!eventNames.includes(event)));
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'kpl-events-'));
 try{await writeEventFiles(dir);const names=await fs.readdir(path.join(dir,'__event'));assert.ok(plannedCoinEvents.every(event=>!names.includes(event+'.txt')));assert.equal(names.length,eventNames.length);}
 finally{await fs.rm(dir,{recursive:true,force:true});}
});
