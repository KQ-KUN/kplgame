import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {completeRelease,releaseJournal} from '../scripts/release-state.mjs';
const sha='a'.repeat(40),old='b'.repeat(40);
function fixture({remote=sha,stale=false,smokeFails=false,browserFails=false}={}) {
  const calls=[];let current=remote;
  return {calls,options:{dryRun:false,targetPlatformSha:sha,registryChanged:false,
    getRemoteSha:async()=>{calls.push('remote');return current;},push:async()=>{calls.push('push');current=sha;},
    wait:async target=>{assert.equal(target,sha);calls.push(stale?'wait-stale-then-match':'wait-match');},
    smoke:async()=>{calls.push('smoke');if(smokeFails)throw Error('bad data');},
    browser:async()=>{calls.push('browser');if(browserFails)throw Error('broken action');}}};
}
test('unchanged registry with stale production still waits for exact target and runs both smoke stages',async()=>{
  const f=fixture({stale:true});assert.equal(await completeRelease(f.options),'already-current-verified');
  assert.deepEqual(f.calls,['remote','wait-stale-then-match','smoke','browser']);
});
test('interruption after local commit resumes push and production verification',async()=>{
  const f=fixture({remote:old});await completeRelease(f.options);
  assert.deepEqual(f.calls,['remote','push','remote','wait-match','smoke','browser']);
});
test('matching production avoids push but still executes smoke',async()=>{
  const f=fixture();await completeRelease(f.options);assert.deepEqual(f.calls,['remote','wait-match','smoke','browser']);
});
test('smoke or browser failures preserve failed stage and each attempt keeps its evidence',async()=>{
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'release-resume-'));
  try {
    for(const stage of ['production-smoke','production-browser']) {
      const journal=releaseJournal(directory,{targetPlatformSha:sha});
      const f=fixture({smokeFails:stage==='production-smoke',browserFails:stage==='production-browser'});
      try {await completeRelease({...f.options,stage:journal.stage,record:journal.record});assert.fail('must fail');}
      catch(error) {journal.fail(error);}
      const report=JSON.parse(await fs.readFile(journal.attempt,'utf8'));
      assert.equal(report.failedStage,stage);assert.equal(report.recovery.resumable,true);assert.equal(report.targetPlatformSha,sha);
    }
    assert.equal((await fs.readdir(directory)).filter(file=>file!=='release-latest.json').length,2);
  } finally {await fs.rm(directory,{recursive:true,force:true});}
});
test('dry run performs no push, deployment wait, HTTP smoke or browser work',async()=>{
  const f=fixture();assert.equal(await completeRelease({...f.options,dryRun:true}),'dry-run-passed');assert.deepEqual(f.calls,[]);
});
