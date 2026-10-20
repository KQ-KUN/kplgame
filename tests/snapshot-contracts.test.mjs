import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateSnapshot} from '../scripts/validate-snapshots.mjs';
test('snapshot provenance and final bytes reject corruption and path escape',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'kpl-snapshot-'));
 try{
  const data=Buffer.from('{"players":[]}'),sha256=createHash('sha256').update(data).digest('hex');
  await fs.writeFile(path.join(root,'players.json'),data);
  const manifest={schemaVersion:1,sourceCommit:'a'.repeat(40),inputs:[{path:'consumer:players.json',sha256}],outputs:[{path:'players.json',sha256,bytes:data.length}],generatedAt:'2026-10-19T00:00:00Z',coverage:{players:0},exclusionRules:[],generator:{name:'fixture',version:'1'}};
  const write=()=>fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest));await write();
  assert.equal((await validateSnapshot(root,'manifest.json')).outputCount,1);
  await fs.writeFile(path.join(root,'players.json'),'{}');await assert.rejects(validateSnapshot(root,'manifest.json'),/output mismatch/);
  manifest.outputs[0].path='../escape.json';await write();await assert.rejects(validateSnapshot(root,'manifest.json'),/越界/);
  manifest.sourceCommit='short';await write();await assert.rejects(validateSnapshot(root,'manifest.json'),/full SHA/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
