import fs from 'node:fs/promises';
import path from 'node:path';
import {root, registry, run, inside} from './common.mjs';

for (const g of (await registry()).filter(g=>g.enabled)) {
  const dest=inside(root,`sources/${g.id}`);
  if (await fs.stat(dest).catch(()=>null)) throw new Error(`${dest} 已存在；不覆盖本地源码。更新请在该仓库自行 fetch/checkout 对应 ref。`);
  await fs.mkdir(dest,{recursive:true});
  run('git',['init'],dest);
  run('git',['remote','add','origin',`https://github.com/${g.repo}.git`],dest);
  const transport=process.platform==='win32' ? ['-c','http.sslBackend=openssl'] : [];
  for(let attempt=1;attempt<=3;attempt++) {
    try {run('git',[...transport,'fetch','--depth','1','origin',g.ref],dest);break;}
    catch(error) {
      if(attempt===3) throw error;
      console.warn(`${g.id} fetch 失败，${attempt * 2} 秒后重试 (${attempt}/3)`);
      await new Promise(resolve=>setTimeout(resolve,attempt * 2_000));
    }
  }
  run('git',['checkout','--detach','FETCH_HEAD'],dest);
}
