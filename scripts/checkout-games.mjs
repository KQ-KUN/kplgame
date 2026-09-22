import fs from 'node:fs/promises';
import path from 'node:path';
import {root, registry, run, inside} from './common.mjs';

for (const g of (await registry()).filter(g=>g.enabled)) {
  const dest=inside(root,`sources/${g.id}`);
  if (await fs.stat(dest).catch(()=>null)) throw new Error(`${dest} 已存在；不覆盖本地源码。更新请在该仓库自行 fetch/checkout 对应 ref。`);
  await fs.mkdir(dest,{recursive:true});
  run('git',['init'],dest);
  run('git',['remote','add','origin',`https://github.com/${g.repo}.git`],dest);
  run('git',['-c','http.sslBackend=openssl','fetch','--depth','1','origin',g.ref],dest);
  run('git',['checkout','--detach','FETCH_HEAD'],dest);
}
