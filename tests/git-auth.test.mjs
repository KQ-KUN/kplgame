import test from 'node:test';
import assert from 'node:assert/strict';
import {checkGitAuth,matchesRepo} from '../scripts/check-git-auth.mjs';
import {classifyGitFailure,credentialContext,gitNetwork} from '../scripts/git-network.mjs';

const repo='KQ-KUN/kpl-link';
const url='https://github.com/KQ-KUN/kpl-link.git';
const ok=stdout=>({status:0,stdout,stderr:''});
const fail=stderr=>({status:128,stdout:'',stderr});
const normal={credentialProvider:'GCM',executionContext:'normal-user'};
const isolated={credentialProvider:'GCM',executionContext:'different-user'};
const sha=`${'a'.repeat(40)}\trefs/heads/main\n`;
const runner=(read=ok(sha),push=ok('Everything up-to-date'))=>(_cwd,args)=>args[0]==='remote' ? ok(url+'\n') : args[0]==='ls-remote' ? read : push;

test('HTTPS preflight confirms remote read and noninteractive push',async()=>{
  const calls=[];
  const execute=(_cwd,args,options)=>{
    calls.push({args,options});
    if(args[0]==='remote') return ok(url+'\n');
    if(args[0]==='ls-remote') return ok(`${'a'.repeat(40)}\trefs/heads/main\n`);
    if(args[0]==='push') return ok('Everything up-to-date\n');
    throw new Error('unexpected Git call');
  };
  const result=await checkGitAuth('/example',repo,{execute,context:normal});
  assert.equal(result.status,'AUTH_OK');
  assert.equal(result.transport,'HTTPS');
  assert.equal(result.credentialProvider,'GCM');
  assert.equal(result.executionContext,'normal-user');
  assert.deepEqual(calls.at(-1).args,['push','--dry-run','origin','main']);
  assert.equal(calls.at(-1).options.remoteURL,url);
  assert.equal(matchesRepo('https://github.com/KQ-KUN/kpl-link',repo),true);
  assert.equal(matchesRepo('https://user:secret@github.com/KQ-KUN/kpl-link.git',repo),false);
});

test('preflight distinguishes authentication, network, and push permission',async()=>{
  assert.equal(classifyGitFailure(fail('fatal: Authentication failed for https://github.com/'),{...normal,transport:'HTTPS'}), 'AUTH_REQUIRED');
  assert.equal(classifyGitFailure(fail('fatal: TLS connect error: unexpected EOF')), 'REMOTE_UNREACHABLE');
  assert.equal(classifyGitFailure(fail('remote: Write access to repository not granted.')), 'NO_PUSH_PERMISSION');
  const execute=(_cwd,args)=>args[0]==='remote' ? ok(url+'\n') : args[0]==='ls-remote' ? ok(`${'b'.repeat(40)}\trefs/heads/main\n`) : fail('remote: Write access to repository not granted.');
  assert.equal((await checkGitAuth('/example',repo,{execute})).status,'NO_PUSH_PERMISSION');
});

test('genuine auth failure requires normal-user push dry-run failure',async()=>{
  const execute=runner(ok(sha),fail('fatal: Authentication failed for https://github.com/'));
  assert.equal((await checkGitAuth('/example',repo,{execute,context:normal})).status,'AUTH_REQUIRED');
  assert.equal((await checkGitAuth('/example',repo,{execute,context:isolated})).status,'CREDENTIAL_CONTEXT_MISMATCH');
});

test('network failure remains network failure after retries',async()=>{
  const result=await checkGitAuth('/example',repo,{execute:runner(fail('connection reset by peer')),context:normal,sleep:async()=>{}});
  assert.equal(result.status,'REMOTE_UNREACHABLE');
});

test('GCM credential access errors are context mismatches',async()=>{
  for(const message of ['SEC_E_NO_CREDENTIALS','user interactivity has been disabled','credential unavailable','credential not found']) {
    assert.equal(classifyGitFailure(fail(message),{...isolated,transport:'HTTPS'}),'CREDENTIAL_CONTEXT_MISMATCH');
    assert.equal(classifyGitFailure(fail(message),{...normal,transport:'HTTPS'}),'GIT_ERROR');
    assert.equal((await checkGitAuth('/example',repo,{execute:runner(ok(sha),fail(message)),context:isolated})).status,'CREDENTIAL_CONTEXT_MISMATCH');
  }
});

test('normal-user retry recovers without requesting login',async()=>{
  const result=await checkGitAuth('/example',repo,{
    execute:runner(ok(sha),fail('SEC_E_NO_CREDENTIALS')),
    normalUserExecute:runner(),context:isolated
  });
  assert.equal(result.status,'AUTH_OK');
  assert.equal(result.executionContext,'normal-user');
});

test('normal-user retry reports genuine push authentication failure',async()=>{
  const result=await checkGitAuth('/example',repo,{
    execute:runner(ok(sha),fail('credential unavailable')),
    normalUserExecute:runner(ok(sha),fail('Authentication failed')),
    context:isolated
  });
  assert.equal(result.status,'AUTH_REQUIRED');
  assert.equal(result.executionContext,'normal-user');
});

test('context diagnostics compare account/profile without exposing them',()=>{
  const calls=[];
  const run=(name,args)=>{
    calls.push([name,...args]);
    if(name==='whoami') return ok('HKQ\\CodexSandboxOffline\n');
    return ok('file:D:/Git/etc/gitconfig\tmanager\n');
  };
  const result=credentialContext('/example',{run,platform:'win32',env:{USERPROFILE:'C:\\Users\\22974',HOMEDRIVE:'C:',HOMEPATH:'\\Users\\22974'}});
  assert.deepEqual(result,isolated);
  assert.equal(JSON.stringify(result).includes('22974'),false);
  assert.equal(calls.some(call=>call.includes('--show-origin')),true);
  assert.equal(calls.some(call=>call.includes('--global')),true);
});

test('transient network failure retries, explicit auth failure does not',async()=>{
  let calls=0;
  const execute=()=>++calls<3 ? fail('connection reset by peer') : ok('done');
  assert.equal(await gitNetwork('/example',['ls-remote'],{execute,sleep:async()=>{}}),'done');
  assert.equal(calls,3);
  calls=0;
  await assert.rejects(gitNetwork('/example',['push'],{execute:()=>{calls++;return fail('Authentication failed');},sleep:async()=>{},failureContext:{...normal,transport:'HTTPS'}}),{code:'AUTH_REQUIRED'});
  assert.equal(calls,1);
});
