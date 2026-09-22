import path from 'node:path';
import fs from 'node:fs/promises';
import {registry,sourceFor,run,inside} from './common.mjs';

const install=process.argv.includes('--install-only');
const test=process.argv.includes('--test-only');
for (const g of (await registry()).filter(g=>g.enabled)) {
  const source=await sourceFor(g);
  if (!(await fs.stat(source).catch(()=>null))?.isDirectory()) throw new Error(`缺少 ${g.id} 源码，先 npm run checkout`);
  if (install) { if(g.build.type==='npm') run('npm',['ci'],source); continue; }
  if (test) { run(g.build.test[0],g.build.test.slice(1),source); continue; }
  if (g.build.type==='npm') run('npm',['run','build',...(g.build.args?.length ? ['--',...g.build.args] : [])],source);
  // KPL 2K already ships its standalone static app; do not run its legacy Hub build.
  await fs.access(path.join(inside(source,g.build.output),'index.html'));
}
if (!install && !test) {
  await import('./collect-games.mjs');
  await import('./validate-build.mjs');
}
