import test from 'node:test';
import assert from 'node:assert/strict';
import {checkGitAuth,classifyGitFailure,gitNetwork,matchesRepo} from '../scripts/check-git-auth.mjs';

const repo='KQ-KUN/kpl-link';
const url='https://github.com/KQ-KUN/kpl-link.git';
const ok=stdout=>({status:0,stdout,stderr:''});
const fail=stderr=>({status:128,stdout:'',stderr});

test('HTTPS preflight confirms remote read and noninteractive push',async()=>{
  const calls=[];
  const execute=(_cwd,args,options)=>{
    calls.push({args,options});
    if(args[0]==='remote') return ok(url+'\n');
    if(args[0]==='ls-remote') return ok(`${'a'.repeat(40)}\trefs/heads/main\n`);
    if(args[0]==='push') return ok('Everything up-to-date\n');
    throw new Error('unexpected Git call');
  };
  const result=await checkGitAuth('/example',repo,{execute});
  assert.equal(result.status,'AUTH_OK');
  assert.equal(result.transport,'HTTPS');
  assert.deepEqual(calls.at(-1).args,['push','--dry-run','origin','main']);
  assert.equal(calls.at(-1).options.remoteURL,url);
  assert.equal(matchesRepo('https://github.com/KQ-KUN/kpl-link',repo),true);
  assert.equal(matchesRepo('https://user:secret@github.com/KQ-KUN/kpl-link.git',repo),false);
});

test('preflight distinguishes authentication, network, and push permission',async()=>{
  assert.equal(classifyGitFailure(fail('fatal: Authentication failed for https://github.com/')), 'AUTH_REQUIRED');
  assert.equal(classifyGitFailure(fail('fatal: TLS connect error: unexpected EOF')), 'REMOTE_UNREACHABLE');
  assert.equal(classifyGitFailure(fail('remote: Write access to repository not granted.')), 'NO_PUSH_PERMISSION');
  const execute=(_cwd,args)=>args[0]==='remote' ? ok(url+'\n') : args[0]==='ls-remote' ? ok(`${'b'.repeat(40)}\trefs/heads/main\n`) : fail('remote: Write access to repository not granted.');
  assert.equal((await checkGitAuth('/example',repo,{execute})).status,'NO_PUSH_PERMISSION');
});

test('transient network failure retries, explicit auth failure does not',async()=>{
  let calls=0;
  const execute=()=>++calls<3 ? fail('connection reset by peer') : ok('done');
  assert.equal(await gitNetwork('/example',['ls-remote'],{execute,sleep:async()=>{}}),'done');
  assert.equal(calls,3);
  calls=0;
  await assert.rejects(gitNetwork('/example',['push'],{execute:()=>{calls++;return fail('Authentication failed');},sleep:async()=>{}}),{code:'AUTH_REQUIRED'});
  assert.equal(calls,1);
});
