import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {credentialContext,executeGit,gitNetwork} from './git-network.mjs';

const shaPattern=/^[a-f0-9]{40}$/;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function matchesRepo(url,repo) {
  return [`https://github.com/${repo}`,`git@github.com:${repo}`,`ssh://git@github.com/${repo}`]
    .some(base=>url===base || url===`${base}.git`);
}

export async function checkGitAuth(cwd,repo,{execute=executeGit,normalUserExecute,sleep=pause,context=credentialContext(cwd)}={}) {
  const readURL=async args=>{
    const result=await execute(cwd,args,{timeoutMs:5_000});
    if(result.error || result.status!==0) throw new Error(`GIT_ERROR: 无法读取 origin`);
    return result.stdout.trim();
  };
  let fetchURL,pushURL;
  try {
    fetchURL=await readURL(['remote','get-url','origin']);
    pushURL=await readURL(['remote','get-url','--push','origin']);
    const transport=pushURL.startsWith('https://')?'HTTPS':'SSH';
    const meta={repo,transport,credentialProvider:transport==='HTTPS'?context.credentialProvider:'SSH'};
    const resolveFailure=(code,executionContext)=>code==='AUTH_REQUIRED' && executionContext!=='normal-user' ?
      transport==='HTTPS' && meta.credentialProvider==='GCM' ? 'CREDENTIAL_CONTEXT_MISMATCH' : 'GIT_ERROR' : code ?? 'GIT_ERROR';
    if(!matchesRepo(fetchURL,repo) || !matchesRepo(pushURL,repo)) return {...meta,status:'REMOTE_MISMATCH',executionContext:context.executionContext};
    const probe=async (runner,executionContext)=>{
      let output;
      try {output=await gitNetwork(cwd,['ls-remote','origin','refs/heads/main'],{remoteURL:fetchURL,execute:runner,sleep,failureContext:{...meta,executionContext}});}
      catch(error) {
        if(error.code==='AUTH_REQUIRED' && executionContext==='normal-user') {
          // Only a normal-user push dry-run can confirm that credentials need renewal.
          try {await gitNetwork(cwd,['push','--dry-run','origin','main'],{remoteURL:pushURL,execute:runner,sleep,timeoutMs:60_000,failureContext:{...meta,executionContext}});}
          catch(pushError) {return {...meta,status:pushError.code ?? 'GIT_ERROR',executionContext};}
          return {...meta,status:'GIT_ERROR',executionContext};
        }
        return {...meta,status:resolveFailure(error.code,executionContext),executionContext};
      }
      const match=output.match(/^([a-f0-9]{40})\s+refs\/heads\/main$/);
      if(!match || !shaPattern.test(match[1])) return {...meta,status:'REMOTE_NOT_FOUND',executionContext};
      try {await gitNetwork(cwd,['push','--dry-run','origin','main'],{remoteURL:pushURL,execute:runner,sleep,timeoutMs:60_000,failureContext:{...meta,executionContext}});}
      catch(error) {return {...meta,status:resolveFailure(error.code,executionContext),executionContext};}
      return {...meta,status:'AUTH_OK',remoteSha:match[1],executionContext};
    };
    let result=await probe(execute,context.executionContext);
    if(result.status==='CREDENTIAL_CONTEXT_MISMATCH' && normalUserExecute) result=await probe(normalUserExecute,'normal-user');
    return result;
  } catch(error) {
    return {status:error.code ?? 'GIT_ERROR',repo,credentialProvider:context.credentialProvider,executionContext:context.executionContext};
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
