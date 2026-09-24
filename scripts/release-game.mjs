import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,registry,run,readJSON} from './common.mjs';
import {waitForProduction,shaPattern} from './wait-production.mjs';
import {smokeProduction} from './smoke-production.mjs';

const args=process.argv.slice(2);
const gameId=args.find(arg=>!arg.startsWith('--'));
const dryRun=args.includes('--dry-run');
const releaseFiles=args.filter(arg=>arg.startsWith('--file=')).map(arg=>arg.slice(7));
const report={gameId,dryRun,steps:[],status:'started'};
const reportPath=path.join(root,'reports/release-latest.json');
const record=(step,detail)=>{report.steps.push({step,detail});console.log(`[release] ${step}: ${detail}`);};
const git=(cwd,...args)=>run('git',args,cwd,true);
const gitRemote=(cwd,repo)=>{
  const fetch=git(cwd,'remote','get-url','origin');
  if(![`https://github.com/${repo}.git`,`git@github.com:${repo}.git`].includes(fetch)) throw new Error(`origin fetch URL 与 ${repo} 不符: ${fetch}`);
};
const pushIsSSH=(cwd,repo)=>git(cwd,'remote','get-url','--push','origin')===`git@github.com:${repo}.git`;
const remoteMain=cwd=>{
  const transport=process.platform==='win32' && git(cwd,'remote','get-url','origin').startsWith('https://') ? ['-c','http.sslBackend=openssl'] : [];
  const output=git(cwd,...transport,'ls-remote','origin','refs/heads/main');
  const match=output.match(/^([a-f0-9]{40})\s+refs\/heads\/main$/);
  if(!match) throw new Error('无法从 origin 查询 main 的完整 SHA');
  return match[1];
};
const rawGit=(cwd,args)=>{
  const result=spawnSync('git',args,{cwd,encoding:'utf8'});
  if(result.error || result.status!==0) throw new Error(`无法检查 Git 文件: ${result.stderr || result.error?.message}`);
  return result.stdout;
};
const dirtyFiles=cwd=>{
  const records=rawGit(cwd,['status','--porcelain=v1','-z','--untracked-files=all']).split('\0').filter(Boolean);
  if(records.some(line=>/[RC]/.test(line[0]) || /[RC]/.test(line[1]))) throw new Error('发布脚本暂不支持重命名或复制文件');
  return records.map(line=>line.slice(3));
};
const samePath=(a,b)=>a.replaceAll('\\','/')===b.replaceAll('\\','/');

async function sourceForRelease(game) {
  const local=await readJSON(path.join(root,'config/local-sources.json')).catch(error=>{if(error.code==='ENOENT')return {};throw error;});
  const sibling={link:'../link',kpl2k:'..',guessing:'../KPL-Guessing'}[game.id] ?? `../${game.repo.split('/')[1]}`;
  const candidates=[local[game.id],sibling].filter(Boolean);
  for(const candidate of candidates) {
    const dir=path.resolve(root,candidate);
    if(!(await fs.stat(dir).catch(()=>null))?.isDirectory()) continue;
    if(path.resolve(git(dir,'rev-parse','--show-toplevel'))!==dir) throw new Error(`源码目录不是独立仓库根: ${dir}`);
    gitRemote(dir,game.repo);
    return dir;
  }
  throw new Error(`未找到 ${game.id} 本地源码；请配置 config/local-sources.json`);
}

async function resetGeneratedSources(games) {
  for(const game of games) {
    const dir=path.join(root,'sources',game.id);
    const entry=await fs.lstat(dir).catch(()=>null);
    if(!entry) continue;
    if(!entry.isDirectory() || entry.isSymbolicLink()) throw new Error(`拒绝清除非普通目录: ${dir}`);
    if(path.resolve(git(dir,'rev-parse','--show-toplevel'))!==dir) throw new Error(`拒绝清除非独立 checkout: ${dir}`);
    const actual=git(dir,'rev-parse','HEAD');
    if(actual!==game.ref) throw new Error(`临时源码版本与注册表不符，拒绝清除: ${dir}`);
    if(dirtyFiles(dir).length) throw new Error(`临时源码包含未提交文件，拒绝清除: ${dir}`);
    await fs.rm(dir,{recursive:true});
  }
}

function replaceRef(raw,game,newRef) {
  const old=`"ref": "${game.ref}"`;
  if(raw.split(old).length!==2) throw new Error(`${game.id} 的旧 ref 无法唯一定位`);
  const updated=raw.replace(old,`"ref": "${newRef}"`);
  const before=JSON.parse(raw),after=JSON.parse(updated);
  const index=before.findIndex(entry=>entry.id===game.id);
  if(index<0 || after[index].ref!==newRef || before.some((entry,i)=>i!==index && JSON.stringify(entry)!==JSON.stringify(after[i]))) throw new Error('注册表更新超出目标游戏');
  return updated;
}

async function main() {
  if(!gameId || args.some(arg=>arg.startsWith('--') && arg!=='--dry-run' && !arg.startsWith('--file='))) throw new Error('用法: npm run release:game -- <game-id> [--dry-run] [--file=游戏相对路径]');
  const games=await registry();
  const game=games.find(entry=>entry.id===gameId && entry.enabled);
  if(!game) throw new Error(`未启用或不存在的游戏: ${gameId}`);
  if(git(root,'branch','--show-current')!=='main') throw new Error('平台必须位于 main 分支');
  gitRemote(root,'KQ-KUN/kplgame');
  if(!dryRun && dirtyFiles(root).length) throw new Error('平台工作区必须先保持干净；自动化只提交本次 registry ref');
  const source=await sourceForRelease(game);
  if(git(source,'branch','--show-current')!=='main') throw new Error('游戏必须位于 main 分支');
  const changed=dirtyFiles(source);
  if(releaseFiles.some(file=>!file || path.isAbsolute(file) || file.split(/[\\/]/).some(part=>part==='..' || part==='.' || !part))) throw new Error('--file 必须是游戏仓库内的普通相对路径');
  const allowed=new Set(releaseFiles.map(file=>file.replaceAll('\\','/')));
  if(changed.some(file=>!allowed.has(file.replaceAll('\\','/'))) || releaseFiles.some(file=>!changed.some(item=>samePath(item,file)))) throw new Error(`游戏改动与 --file 清单不一致: ${changed.join(', ') || '无改动'}`);
  if(new Set(releaseFiles).size!==releaseFiles.length) throw new Error('--file 不得重复');
  record('source',source);
  const previousRemote=remoteMain(source);
  record('game-remote-before',previousRemote);
  run(game.build.test[0],game.build.test.slice(1),source);
  record('game-test','passed');
  const packageFile=path.join(source,'package.json');
  const packageInfo=await readJSON(packageFile).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  if(packageInfo?.scripts?.typecheck) {run('npm',['run','typecheck'],source);record('game-typecheck','passed');}
  if(game.build.type==='npm') run('npm',['run','build',...(game.build.args?.length?['--',...game.build.args]:[])],source);
  else await fs.access(path.join(source,game.build.output,'index.html'));
  record('game-build','passed');
  let newRef=previousRemote;
  if(!dryRun) {
    if(!pushIsSSH(source,game.repo) || !pushIsSSH(root,'KQ-KUN/kplgame')) throw new Error('游戏与平台 origin push URL 必须先配置为 GitHub SSH');
    if(releaseFiles.length) {
      run('git',['add','--',...releaseFiles],source);
      const staged=rawGit(source,['diff','--cached','--name-only','-z']).split('\0').filter(Boolean);
      if(staged.some(file=>!allowed.has(file.replaceAll('\\','/')))) throw new Error('暂存区含非本次任务文件');
      run('git',['commit','-m',`chore(release): update ${game.name}`],source);
    }
    const localHead=git(source,'rev-parse','HEAD');
    if(!shaPattern.test(localHead)) throw new Error('游戏 HEAD 无效');
    run('git',['push','origin','main'],source);
    newRef=remoteMain(source);
    if(newRef!==localHead) throw new Error('游戏远端 main 与刚推送的 HEAD 不一致');
    record('game-push',newRef);
  }
  const registryFile=path.join(root,'config/games.json');
  const original=await fs.readFile(registryFile,'utf8');
  const updated=replaceRef(original,game,newRef);
  if(updated!==original) await fs.writeFile(registryFile,updated);
  let registryCommitted=false;
  try {
    process.env.KPL_IGNORE_LOCAL_SOURCES='1';
    await resetGeneratedSources(games.filter(entry=>entry.enabled));
    for(const script of ['checkout','install:games','test','build','validate']) {
      run('npm',['run',script],root);
      record(`platform-${script}`,'passed');
    }
    if(dryRun) {report.status='dry-run-passed';return;}
    if(updated===original) {record('platform-release','注册表 ref 未变化，无需发布');report.status='already-current';return;}
    const modified=dirtyFiles(root);
    if(modified.some(file=>file!=='config/games.json')) throw new Error(`平台出现意外变更: ${modified.join(', ')}`);
    if(modified.length) {
      run('git',['add','--','config/games.json'],root);
      run('git',['commit','-m',`chore(release): update ${game.name} to ${newRef.slice(0,7)}`],root);
      registryCommitted=true;
    }
    const platformHead=git(root,'rev-parse','HEAD');
    run('git',['push','origin','main'],root);
    const platformRemote=remoteMain(root);
    if(platformRemote!==platformHead) throw new Error('平台远端 main 与刚推送的 HEAD 不一致');
    record('platform-push',platformRemote);
    await waitForProduction(platformRemote);
    record('production-version','matched');
    await smokeProduction({games:games.filter(entry=>entry.enabled)});
    record('production-smoke','passed');
    report.status='published';
  } finally {
    if(!registryCommitted && updated!==original) await fs.writeFile(registryFile,original);
  }
}

try {await main();}
catch(error) {report.status='failed';report.error=error.message;console.error(`[release] ${error.message}`);process.exitCode=1;}
finally {await fs.mkdir(path.dirname(reportPath),{recursive:true});await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');}
