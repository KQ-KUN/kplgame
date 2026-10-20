import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {root,registry,sourceFor,inside} from './common.mjs';
import {plannedCoinEvents} from './analytics-events.mjs';

export const snapshotPaths={kpl2k:'app/data/consumption-manifest.json',guessing:'public/data/snapshot_manifest.json',link:'public/data/manifest.json',merge:'public/data/manifest.json',coin:'data/consumption-manifest.json'};
export async function validateSnapshot(source,relative) {
  const manifest=JSON.parse(await fs.readFile(inside(source,relative),'utf8'));
  const errors=[];
  if(manifest.schemaVersion!==1)errors.push('schemaVersion');
  if(!/^[a-f0-9]{40}$/.test(manifest.sourceCommit))errors.push('sourceCommit must be full SHA');
  if(!Number.isFinite(Date.parse(manifest.generatedAt)) || !/(?:Z|\+00:00)$/.test(manifest.generatedAt))errors.push('generatedAt UTC');
  for(const key of ['coverage','generator'])if(!manifest[key] || typeof manifest[key]!=='object')errors.push(key);
  if(!manifest.generator?.name || !manifest.generator?.version)errors.push('generator identity');
  if(!Array.isArray(manifest.exclusionRules))errors.push('exclusionRules');
  if(!Array.isArray(manifest.inputs)||!manifest.inputs.length)errors.push('inputs');
  for(const input of manifest.inputs??[])if(typeof input.path!=='string'||!/^[a-f0-9]{64}$/.test(input.sha256))errors.push('invalid input hash');
  if(!Array.isArray(manifest.outputs)||!manifest.outputs.length)errors.push('outputs');
  const seen=new Set();let bytes=0;
  for(const output of manifest.outputs??[]) {
    if(typeof output.path!=='string'||seen.has(output.path)||!/^[a-f0-9]{64}$/.test(output.sha256)){errors.push('invalid/duplicate output');continue;}
    seen.add(output.path);
    try {
      // Hash the standalone source/build output before platform navigation/analytics adapters.
      const content=await fs.readFile(inside(source,output.sourcePath??output.path));
      if(content.length!==output.bytes || createHash('sha256').update(content).digest('hex')!==output.sha256)errors.push(`output mismatch: ${output.path}`);
      bytes+=content.length;
    }catch(error){errors.push(`${output.path}: ${error.message}`);}
  }
  if(errors.length)throw new Error(`${relative}: ${errors.join('; ')}`);
  return {sourceCommit:manifest.sourceCommit,outputCount:seen.size,outputBytes:bytes,coverage:manifest.coverage,quality:manifest.quality??null};
}
export async function validateSnapshots({strict=false}={}) {
 const results=[];
 for(const game of (await registry()).filter(g=>g.enabled)){
  const source=await sourceFor(game),manifest=snapshotPaths[game.id];
  if(!manifest)throw new Error(`${game.id}: missing snapshot contract`);
  try{results.push({id:game.id,status:'verified',...await validateSnapshot(source,manifest)});}
  catch(error){if(error.code==='ENOENT' && !strict)results.push({id:game.id,status:'legacy-unverified',reason:'locked legacy source has no shared manifest; coordinated game release required'});else throw error;}
  if(game.id==='coin') {
    const coin=await import(pathToFileURL(path.join(source,'src/analytics.mjs')).href);
    if(coin.ANALYTICS_ENABLED!==false || JSON.stringify(coin.COIN_EVENTS)!==JSON.stringify(plannedCoinEvents))throw new Error('Coin analytics switch/planned platform contract mismatch');
    results.at(-1).analytics='disabled product switch; planned events match platform';
  }
 }
 await fs.mkdir(path.join(root,'reports'),{recursive:true});
 await fs.writeFile(path.join(root,'reports/snapshot-contracts.json'),JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results,null,2));return results;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)await validateSnapshots({strict:process.argv.includes('--strict')});
