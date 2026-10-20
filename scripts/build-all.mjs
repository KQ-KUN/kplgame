import path from 'node:path';
import fs from 'node:fs/promises';
import {registry,sourceFor,run,inside,readJSON} from './common.mjs';
import {gameValidation} from './game-validation.mjs';

const install=process.argv.includes('--install-only');
const test=process.argv.includes('--test-only');
for (const g of (await registry()).filter(g=>g.enabled)) {
  const source=await sourceFor(g);
  if (!(await fs.stat(source).catch(()=>null))?.isDirectory()) throw new Error(`缺少 ${g.id} 源码，先 npm run checkout`);
  const info=await readJSON(path.join(source,'package.json')).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  const plan=gameValidation(g,info);
  if (install) { if(plan.install) run('npm',['ci'],source); continue; }
  if (test) { run(plan.test[0],plan.test.slice(1),source); continue; }
  if (plan.typecheck)run(plan.typecheck[0],plan.typecheck.slice(1),source);
  if (plan.build) run(plan.build[0],plan.build.slice(1),source);
  // KPL 2K already ships its standalone static app; do not run its legacy Hub build.
  await fs.access(path.join(inside(source,g.build.output),'index.html'));
}
if (!install && !test) {
  const {validateSnapshots}=await import('./validate-snapshots.mjs');
  await validateSnapshots();
  await import('./collect-games.mjs');
  await import('./validate-build.mjs');
}
