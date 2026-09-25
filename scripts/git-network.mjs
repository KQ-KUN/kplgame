import {spawn,spawnSync} from 'node:child_process';
import path from 'node:path';

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function classifyGitFailure(result,{transport='HTTPS',credentialProvider='GCM',executionContext='unknown'}={}) {
  const output=`${result.stderr ?? ''}\n${result.error?.message ?? ''}`;
  if(result.error?.code==='ETIMEDOUT') return 'REMOTE_TIMEOUT';
  if(/sec_e_no_credentials|user interactivity has been disabled|credentials? (?:not found|unavailable)|unable to persist credentials|credential store.*(?:unavailable|inaccessible)/i.test(output))
    return transport==='HTTPS' && credentialProvider==='GCM' && executionContext==='different-user' ? 'CREDENTIAL_CONTEXT_MISMATCH' : 'GIT_ERROR';
  if(/connection (?:reset|refused|timed out)|failed to connect|timed? out|could not resolve|name or service not known|temporary failure|network is unreachable|tls connect error|ssl routines.*unexpected eof|http\/2 stream/i.test(output)) return 'REMOTE_UNREACHABLE';
  if(/permission denied \(publickey\)|authentication failed|terminal prompts disabled|could not read (?:username|password)|host key verification failed|no authentication methods|interactive prompts are disabled|cannot prompt/i.test(output))
    return executionContext==='normal-user' ? 'AUTH_REQUIRED' : transport==='HTTPS' && credentialProvider==='GCM' && executionContext==='different-user' ? 'CREDENTIAL_CONTEXT_MISMATCH' : 'GIT_ERROR';
  if(/write access to repository not granted|permission to .* denied|remote:.*(?:permission|write access).*denied|requested url returned error: 403/i.test(output)) return 'NO_PUSH_PERMISSION';
  if(/non-fast-forward|fetch first|protected branch|repository rule violations/i.test(output)) return 'PUSH_REJECTED';
  if(/repository not found/i.test(output)) return 'REMOTE_NOT_FOUND';
  return 'GIT_ERROR';
}

// Do not return account names, profile paths, helper arguments, or credentials.
export function credentialContext(cwd,{run=spawnSync,env=process.env,platform=process.platform}={}) {
  const command=(name,args)=>{
    const result=run(name,args,{cwd,env,encoding:'utf8',timeout:5_000,windowsHide:true});
    return result.status===0 ? result.stdout?.trim() ?? '' : '';
  };
  const helpers=[command('git',['config','--show-origin','--get-all','credential.helper']),command('git',['config','--global','--get-all','credential.helper'])]
    .flatMap(output=>output.split('\n').map(line=>line.split('\t').at(-1))).join('\n');
  const credentialProvider=/\bmanager(?:-core)?\b/i.test(helpers) ? 'GCM' : helpers.trim() ? 'OTHER' : 'NONE';
  if(platform!=='win32') return {credentialProvider,executionContext:'normal-user'};
  const identity=command('whoami',[]).split('\\').at(-1).toLowerCase();
  const profile=path.win32.basename(env.USERPROFILE ?? '').toLowerCase();
  const home=env.HOME ? path.win32.resolve(env.HOME) : '';
  const driveHome=env.HOMEDRIVE && env.HOMEPATH ? path.win32.resolve(env.HOMEDRIVE+env.HOMEPATH) : '';
  const profileConflict=Boolean(home && env.USERPROFILE && home.toLowerCase()!==path.win32.resolve(env.USERPROFILE).toLowerCase()) ||
    Boolean(driveHome && env.USERPROFILE && driveHome.toLowerCase()!==path.win32.resolve(env.USERPROFILE).toLowerCase());
  const executionContext=identity && profile ? identity!==profile || profileConflict ? 'different-user' : 'normal-user' : 'unknown';
  return {credentialProvider,executionContext};
}

function terminateTree(child) {
  if(!child.pid) return Promise.resolve();
  if(process.platform!=='win32') {child.kill('SIGKILL');return Promise.resolve();}
  return new Promise(resolve=>{
    let killer;
    try {killer=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});}
    catch {child.kill();resolve();return;}
    const timer=setTimeout(()=>{child.kill();resolve();},5_000);
    const done=()=>{clearTimeout(timer);resolve();};
    killer.once('error',done);
    killer.once('close',done);
  });
}

export function executeGit(cwd,args,{remoteURL='',timeoutMs=45_000}={}) {
  const transport=process.platform==='win32' && remoteURL.startsWith('https://') ? ['-c','http.sslBackend=openssl'] : [];
  const env={...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'0',SSH_ASKPASS_REQUIRE:'never'};
  if(remoteURL.startsWith('git@') || remoteURL.startsWith('ssh://')) env.GIT_SSH_COMMAND='ssh -o BatchMode=yes';
  return new Promise(resolve=>{
    let child;
    try {child=spawn('git',[...transport,...args],{cwd,env,windowsHide:true,stdio:['ignore','pipe','pipe']});}
    catch(error) {resolve({status:null,stdout:'',stderr:'',error});return;}
    let stdout='',stderr='',settled=false,expired=false;
    const finish=result=>{if(settled)return;settled=true;clearTimeout(timer);resolve(result);};
    child.stdout.on('data',chunk=>{stdout+=chunk.toString();});
    child.stderr.on('data',chunk=>{stderr+=chunk.toString();});
    child.once('error',error=>finish({status:null,stdout,stderr,error}));
    child.once('close',status=>{if(!expired)finish({status,stdout,stderr});});
    const timer=setTimeout(async()=>{
      expired=true;
      await terminateTree(child);
      // A helper may retain inherited pipes even after Git exits. Do not let
      // those handles keep the release process alive after the deadline.
      child.kill('SIGKILL');
      child.stdout.destroy();
      child.stderr.destroy();
      child.unref();
      finish({status:null,stdout,stderr,error:Object.assign(new Error('Git network operation timed out'),{code:'ETIMEDOUT'})});
    },timeoutMs);
  });
}

export async function gitNetwork(cwd,args,{remoteURL='',execute=executeGit,sleep=pause,attempts=3,timeoutMs=45_000,failureContext,onAttempt,onRetry}={}) {
  for(let attempt=1;attempt<=attempts;attempt++) {
    onAttempt?.({attempt,attempts});
    const result=await execute(cwd,args,{remoteURL,timeoutMs});
    if(!result.error && result.status===0) return result.stdout?.trim() ?? '';
    const code=classifyGitFailure(result,failureContext ?? credentialContext(cwd));
    if(['REMOTE_UNREACHABLE','REMOTE_TIMEOUT'].includes(code) && attempt<attempts) {
      onRetry?.({attempt,attempts,code});
      await sleep(attempt * 2_000);
      continue;
    }
    const error=new Error(`${code}: Git ${args[0]} 失败${attempt>1?`，已尝试 ${attempt} 次`:''}`);
    error.code=code;
    throw error;
  }
}
