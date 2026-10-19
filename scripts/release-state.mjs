import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {shaPattern} from './wait-production.mjs';

// Each attempt has its own checkpoint file; latest is only a convenience pointer.
export function releaseJournal(directory, initial) {
  fs.mkdirSync(directory,{recursive:true});
  const report={...initial,runId:randomUUID(),startedAt:new Date().toISOString(),steps:[],status:'started',activeStage:'preflight'};
  const attempt=path.join(directory,`release-${report.startedAt.replaceAll(/[:.]/g,'-')}-${report.runId}.json`);
  const save=()=>{
    report.updatedAt=new Date().toISOString();
    const body=JSON.stringify(report,null,2)+'\n';
    fs.writeFileSync(attempt,body);
    fs.writeFileSync(path.join(directory,'release-latest.json'),body);
  };
  const stage=name=>{report.activeStage=name;save();};
  const record=(step,detail)=>{report.steps.push({step,detail});save();};
  const fail=error=>{
    report.status='failed';report.failedStage=report.activeStage;report.error=error.message;
    report.recovery={resumable:Boolean(report.targetPlatformSha),targetPlatformSha:report.targetPlatformSha??null,
      action:report.targetPlatformSha?'rerun-release-to-verify-target':'resolve-failure-and-rerun'};
    save();
  };
  save();
  return {report,attempt,save,stage,record,fail};
}

export async function completeRelease({dryRun,targetPlatformSha,registryChanged,getRemoteSha,push,wait,smoke,browser,stage=()=>{},record=()=>{}}) {
  if(dryRun) {record('production-verification','skipped: dry-run');return 'dry-run-passed';}
  if(!shaPattern.test(targetPlatformSha)) throw new Error('缺少明确的目标平台 commit');
  stage('platform-remote');
  if(await getRemoteSha()!==targetPlatformSha) {
    // Also resumes a prior attempt interrupted after committing but before pushing.
    stage('platform-push');await push();
    if(await getRemoteSha()!==targetPlatformSha) throw new Error('平台远端 main 与目标 HEAD 不一致');
    record('platform-push',targetPlatformSha);
  } else record('platform-push','not needed: remote already matches target');
  stage('production-version');await wait(targetPlatformSha);record('production-version',targetPlatformSha);
  stage('production-smoke');await smoke();record('production-smoke','passed');
  stage('production-browser');await browser();record('production-browser','passed');
  return registryChanged?'published':'already-current-verified';
}
