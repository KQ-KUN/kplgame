import {pathToFileURL} from 'node:url';

export const productionURL='https://kplgame.cn/release-meta.json';
export const shaPattern=/^[a-f0-9]{40}$/;

export async function waitForProduction(expected,{url=productionURL,timeoutMs=600_000,intervalMs=7_000,fetcher=fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=Date.now}={}) {
  if(!shaPattern.test(expected)) throw new Error('必须提供完整的 40 位平台 commit SHA');
  const deadline=now()+timeoutMs;
  let last='尚未收到有效响应';
  while(true) {
    try {
      const response=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(15_000)});
      if(!response.ok) last=`HTTP ${response.status}`;
      else {
        const meta=await response.json();
        if(meta?.schemaVersion===1 && meta.platformCommit===expected) {
          console.log(`生产版本已更新: ${expected}`);
          return meta;
        }
        last=`生产版本 ${String(meta?.platformCommit ?? '缺失')}`;
      }
    } catch(error) { last=error.message; }
    if(now()>=deadline) throw new Error(`等待生产版本超时: 目标 ${expected}; 最后状态: ${last}`);
    console.log(`等待 EdgeOne: ${last}`);
    await sleep(Math.min(intervalMs,Math.max(0,deadline-now())));
  }
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  waitForProduction(process.argv[2]).catch(error=>{console.error(error.message);process.exitCode=1;});
}
