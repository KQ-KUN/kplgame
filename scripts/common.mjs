import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const dist = path.join(root, 'dist');
export const readJSON = async p => JSON.parse(await fs.readFile(p, 'utf8'));
export function inside(base, child) {
  const resolved = path.resolve(base, child);
  if (resolved === base || !resolved.startsWith(base + path.sep)) throw new Error(`路径越界或指向根目录: ${child}`);
  return resolved;
}
export function validateRegistry(games) {
  if (!Array.isArray(games)) throw new Error('注册表必须为数组');
  const ids = new Set();
  const paths = new Set();
  for (const g of games) {
    if (!/^[a-z][a-z0-9-]*$/.test(g.id) || ids.has(g.id)) throw new Error('无效或重复 id');
    if (!/^\/[a-z][a-z0-9-]*\/$/.test(g.path) || paths.has(g.path) || ['/assets/','/shared/'].includes(g.path)) throw new Error('无效或重复路径');
    if (!/^KQ-KUN\/[A-Za-z0-9_.-]+$/.test(g.repo)) throw new Error('无效仓库');
    if (!['red','blue','purple'].includes(g.accent) || typeof g.enabled !== 'boolean') throw new Error('无效 accent/enabled');
    for (const key of ['name','category','description']) if (typeof g[key] !== 'string' || !g[key].trim()) throw new Error(`缺少 ${key}`);
    if (g.enabled) {
      if (!/^[a-f0-9]{40}$/.test(g.ref)) throw new Error('启用项必须锁定 commit SHA');
      if (!['npm','static'].includes(g.build?.type)) throw new Error('无效 build 类型');
      if (g.build.args !== undefined && (!Array.isArray(g.build.args) || !g.build.args.every(s=>typeof s==='string'))) throw new Error('无效 build args');
      inside(root, g.build.output);
      if (!Array.isArray(g.build.test) || !g.build.test.length || !g.build.test.every(s => typeof s === 'string')) throw new Error('缺少测试命令');
      if (typeof g.icon !== 'string') throw new Error('缺少图标');
      inside(root, g.icon);
    }
    ids.add(g.id); paths.add(g.path);
  }
  return games;
}
export const registry = async () => validateRegistry(await readJSON(path.join(root,'config/games.json')));
export async function sourceFor(g) {
  const local = await readJSON(path.join(root,'config/local-sources.json')).catch(e => { if (e.code === 'ENOENT') return {}; throw e; });
  return path.resolve(root, local[g.id] || `sources/${g.id}`);
}
export function run(command, args, cwd, capture = false) {
  // Invoke npm's JS entrypoint on Windows, without shell string interpolation.
  if (command === 'npm' && process.platform === 'win32') {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) throw new Error('Windows 请从 npm run 调用，以定位 npm CLI');
    args = [npmCli, ...args]; command = process.execPath;
  }
  const r = spawnSync(command, args, { cwd, encoding:'utf8', stdio: capture ? 'pipe' : 'inherit', env:{...process.env, PYTHONUTF8:'1'} });
  if (r.error || r.status !== 0) throw new Error(`${command} 执行失败: ${r.error?.message || r.stderr || r.status}`);
  return r.stdout?.trim();
}
export async function files(dir) {
  const result=[];
  for (const entry of await fs.readdir(dir,{withFileTypes:true})) {
    const p=path.join(dir,entry.name);
    if (entry.isSymbolicLink()) throw new Error(`不允许符号链接产物: ${p}`);
    if (entry.isDirectory()) result.push(...await files(p)); else result.push(p);
  }
  return result;
}
export const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
