import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mkdirSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkoutGame} from '../scripts/checkout-games.mjs';
import {classifyGitFailure} from '../scripts/git-network.mjs';

const game={id:'link',repo:'KQ-KUN/kpl-link',ref:'a'.repeat(40)};
const timedOut=()=>({status:null,stdout:'',stderr:'',error:Object.assign(new Error('timed out'),{code:'ETIMEDOUT'})});
const ok=()=>({status:0,stdout:'',stderr:''});

async function fixture() {
  const baseDir=await fs.mkdtemp(path.join(os.tmpdir(),'kpl-checkout-'));
  const localCalls=[];
  const runLocal=(_command,args,cwd)=>{
    localCalls.push(args);
    if(args[0]==='init') mkdirSync(path.join(cwd,'.git'));
  };
  return {baseDir,localCalls,runLocal,cleanup:()=>fs.rm(baseDir,{recursive:true,force:true})};
}

test('fetch succeeds once and reports game, attempt and SHA',async()=>{
  const box=await fixture();
  try {
    const lines=[];
    let calls=0;
    await checkoutGame(game,{...box,execute:()=>{calls++;return ok();},log:line=>lines.push(line)});
    assert.equal(calls,1);
    assert.deepEqual(lines,[`[checkout] link attempt 1/3`,`[checkout] link fetched ${game.ref}`]);
    assert.equal(box.localCalls.at(-1)[0],'checkout');
  } finally {await box.cleanup();}
});

test('first timeout retries and second fetch succeeds',async()=>{
  const box=await fixture();
  try {
    let calls=0;
    const lines=[];
    await checkoutGame(game,{...box,execute:()=>++calls===1?timedOut():ok(),sleep:async()=>{},log:line=>lines.push(line),warn:line=>lines.push(line)});
    assert.equal(calls,2);
    assert.deepEqual(lines.slice(0,3),['[checkout] link attempt 1/3','[checkout] link timeout, retrying...','[checkout] link attempt 2/3']);
  } finally {await box.cleanup();}
});

test('three timeouts fail as REMOTE_TIMEOUT and remove only the created checkout',async()=>{
  const box=await fixture();
  try {
    let calls=0;
    await assert.rejects(checkoutGame(game,{...box,execute:()=>{calls++;return timedOut();},sleep:async()=>{},log:()=>{},warn:()=>{}}),{code:'REMOTE_TIMEOUT',message:'REMOTE_TIMEOUT: KQ-KUN/kpl-link'});
    assert.equal(calls,3);
    await assert.rejects(fs.stat(path.join(box.baseDir,'sources','link')),{code:'ENOENT'});
    assert.equal(classifyGitFailure(timedOut()),'REMOTE_TIMEOUT');
    assert.notEqual(classifyGitFailure(timedOut()),'AUTH_REQUIRED');
  } finally {await box.cleanup();}
});

test('non-network Git failure does not retry',async()=>{
  const box=await fixture();
  try {
    let calls=0;
    await assert.rejects(checkoutGame(game,{...box,execute:()=>{calls++;return {status:128,stderr:'fatal: bad object',stdout:''};},sleep:async()=>{},log:()=>{}}),{code:'GIT_ERROR'});
    assert.equal(calls,1);
    await assert.rejects(fs.stat(path.join(box.baseDir,'sources','link')),{code:'ENOENT'});
  } finally {await box.cleanup();}
});

test('pre-existing user source is preserved',async()=>{
  const box=await fixture();
  try {
    const dest=path.join(box.baseDir,'sources','link');
    await fs.mkdir(dest,{recursive:true});
    await fs.writeFile(path.join(dest,'mine.txt'),'keep');
    await assert.rejects(checkoutGame(game,{...box,execute:()=>ok()}),/已存在/);
    assert.equal(await fs.readFile(path.join(dest,'mine.txt'),'utf8'),'keep');
  } finally {await box.cleanup();}
});
