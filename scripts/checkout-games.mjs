import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root,registry,run,inside} from './common.mjs';
import {gitNetwork} from './git-network.mjs';

async function cleanupCreatedCheckout(dest) {
  const entry=await fs.lstat(dest).catch(error=>error.code==='ENOENT'?null:Promise.reject(error));
  if(!entry) return;
  if(!entry.isDirectory() || entry.isSymbolicLink()) throw new Error(`拒绝清理非普通 checkout: ${dest}`);
  const names=await fs.readdir(dest);
  if(names.some(name=>name!=='.git')) throw new Error(`失败 checkout 中出现额外文件，保留现场: ${dest}`);
  if(names.includes('.git')) {
    const gitDir=await fs.lstat(path.join(dest,'.git'));
    if(!gitDir.isDirectory() || gitDir.isSymbolicLink()) throw new Error(`拒绝清理异常 .git: ${dest}`);
  }
  await fs.rm(dest,{recursive:true});
}

export async function checkoutGame(game,{baseDir=root,runLocal=run,execute,sleep,log=console.log,warn=console.warn}={}) {
  const dest=inside(baseDir,`sources/${game.id}`);
  const remoteURL=`https://github.com/${game.repo}.git`;
  await fs.mkdir(path.dirname(dest),{recursive:true});
  try {await fs.mkdir(dest);}
  catch(error) {
    if(error.code==='EEXIST') throw new Error(`${dest} 已存在；不覆盖本地源码。更新请在该仓库自行 fetch/checkout 对应 ref。`);
    throw error;
  }
  try {
    runLocal('git',['init'],dest);
    runLocal('git',['remote','add','origin',remoteURL],dest);
    const options={remoteURL,timeoutMs:45_000,attempts:3,
      onAttempt:({attempt,attempts})=>log(`[checkout] ${game.id} attempt ${attempt}/${attempts}`),
      onRetry:({code})=>warn(`[checkout] ${game.id} ${code==='REMOTE_TIMEOUT'?'timeout':'network unavailable'}, retrying...`)};
    if(execute) options.execute=execute;
    if(sleep) options.sleep=sleep;
    await gitNetwork(dest,['fetch','--depth','1','origin',game.ref],options);
    log(`[checkout] ${game.id} fetched ${game.ref}`);
    runLocal('git',['checkout','--detach','FETCH_HEAD'],dest);
  } catch(error) {
    await cleanupCreatedCheckout(dest);
    if(error.code) {
      const failure=new Error(`${error.code}: ${game.repo}`);
      failure.code=error.code;
      throw failure;
    }
    throw error;
  }
}

export async function checkoutGames(games,options={}) {
  for(const game of games.filter(entry=>entry.enabled)) await checkoutGame(game,options);
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {await checkoutGames(await registry());}
  catch(error) {console.error(`[checkout] ${error.message}`);process.exitCode=1;}
}
