import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const shaPattern=/^[a-f0-9]{40}$/;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function matchesRepo(url,repo) {
  return [`https://github.com/${repo}`,`git@github.com:${repo}`,`ssh://git@github.com/${repo}`]
    .some(base=>url===base || url===`${base}.git`);
}

export function classifyGitFailure(result) {
  const output=`${result.stderr ?? ''}\n${result.error?.message ?? ''}`;
  if(result.error?.code==='ETIMEDOUT' || /connection (?:reset|refused|timed out)|failed to connect|timed? out|could not resolve|name or service not known|temporary failure|network is unreachable|tls connect error|ssl routines.*unexpected eof|http\/2 stream|sec_e_no_credentials/i.test(output)) return 'REMOTE_UNREACHABLE';
  if(/permission denied \(publickey\)|authentication failed|terminal prompts disabled|could not read (?:username|password)|host key verification failed|no authentication methods|interactive prompts are disabled|user interactivity has been disabled|cannot prompt|credentials? (?:not found|unavailable)/i.test(output)) return 'AUTH_REQUIRED';
  if(/write access to repository not granted|permission to .* denied|remote:.*(?:permission|write access).*denied|requested url returned error: 403/i.test(output)) return 'NO_PUSH_PERMISSION';
  if(/non-fast-forward|fetch first|protected branch|repository rule violations/i.test(output)) return 'PUSH_REJECTED';
  if(/repository not found/i.test(output)) return 'REMOTE_NOT_FOUND';
  return 'GIT_ERROR';
}

export function executeGit(cwd,args,{remoteURL='',timeoutMs=30_000}={}) {
  const transport=process.platform==='win32' && remoteURL.startsWith('https://') ? ['-c','http.sslBackend=openssl'] : [];
  const env={...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'0',SSH_ASKPASS_REQUIRE:'never'};
  if(remoteURL.startsWith('git@') || remoteURL.startsWith('ssh://')) env.GIT_SSH_COMMAND='ssh -o BatchMode=yes';
  return spawnSync('git',[...transport,...args],{cwd,env,encoding:'utf8',timeout:timeoutMs,windowsHide:true});
}

export async function gitNetwork(cwd,args,{remoteURL='',execute=executeGit,sleep=pause,attempts=3,timeoutMs=30_000}={}) {
  for(let attempt=1;attempt<=attempts;attempt++) {
    const result=execute(cwd,args,{remoteURL,timeoutMs});
    if(!result.error && result.status===0) return result.stdout?.trim() ?? '';
    const code=classifyGitFailure(result);
    if(code==='REMOTE_UNREACHABLE' && attempt<attempts) {await sleep(attempt * 2_000);continue;}
    const error=new Error(`${code}: Git ${args[0]} 失败${attempt>1?`，已尝试 ${attempt} 次`:''}`);
    error.code=code;
    throw error;
  }
}

export async function checkGitAuth(cwd,repo,{execute=executeGit,sleep=pause}={}) {
  const readURL=args=>{
    const result=execute(cwd,args);
    if(result.error || result.status!==0) throw new Error(`GIT_ERROR: 无法读取 origin`);
    return result.stdout.trim();
  };
  let fetchURL,pushURL;
  try {
    fetchURL=readURL(['remote','get-url','origin']);
    pushURL=readURL(['remote','get-url','--push','origin']);
    if(!matchesRepo(fetchURL,repo) || !matchesRepo(pushURL,repo)) return {status:'REMOTE_MISMATCH',repo};
    const output=await gitNetwork(cwd,['ls-remote','origin','refs/heads/main'],{remoteURL:fetchURL,execute,sleep});
    const match=output.match(/^([a-f0-9]{40})\s+refs\/heads\/main$/);
    if(!match || !shaPattern.test(match[1])) return {status:'REMOTE_NOT_FOUND',repo};
    await gitNetwork(cwd,['push','--dry-run','origin','main'],{remoteURL:pushURL,execute,sleep,timeoutMs:60_000});
    return {status:'AUTH_OK',repo,remoteSha:match[1],transport:pushURL.startsWith('https://')?'HTTPS':'SSH'};
  } catch(error) {
    return {status:error.code ?? 'GIT_ERROR',repo};
  }
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const [directory,repo]=process.argv.slice(2);
  if(!directory || !/^KQ-KUN\/[A-Za-z0-9_.-]+$/.test(repo ?? '')) {
    console.error('用法: node scripts/check-git-auth.mjs <仓库目录> KQ-KUN/<repo>');
    process.exitCode=2;
  } else {
    const result=await checkGitAuth(path.resolve(directory),repo);
    console.log(JSON.stringify(result));
    if(result.status!=='AUTH_OK') process.exitCode=1;
  }
}
