import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {validateRegistry,escapeHTML,inside} from '../scripts/common.mjs';
process.env.KPL_VALIDATOR_IMPORT_ONLY='1';
const {resolveAsset}=await import('../scripts/validate-build.mjs');
const game={id:'demo',name:'Demo',repo:'KQ-KUN/demo',path:'/demo/',category:'测试',description:'测试',accent:'blue',enabled:true,ref:'a'.repeat(40),icon:'assets/a.svg',build:{type:'static',output:'app',test:['node','test.js']}};
test('reject duplicate routes, traversal and unpinned enabled game',()=>{
  assert.throws(()=>validateRegistry([game,{...game,id:'other'}]));
  assert.throws(()=>validateRegistry([{...game,path:'/../'}]));
  assert.throws(()=>validateRegistry([{...game,ref:'main'}]));
  assert.throws(()=>validateRegistry([{...game,build:{...game.build,output:'../outside'}}]));
  assert.equal(validateRegistry([game])[0].id,'demo');
});
test('escape game copy rather than injecting HTML',()=>assert.equal(escapeHTML('<a "x">&'), '&lt;a &quot;x&quot;&gt;&amp;'));
test('resolve child-path assets, root assets, query and fragment',()=>{
  const root=path.resolve('fixture');
  const doc=path.join(root,'demo/index.html');
  assert.equal(resolveAsset(doc,'./assets/x.js?v=1',root),path.join(root,'demo/assets/x.js'));
  assert.equal(resolveAsset(doc,'/shared/x.css',root),path.join(root,'shared/x.css'));
  assert.equal(resolveAsset(doc,'#home',root),null);
  assert.throws(()=>resolveAsset(doc,'../../outside',root));
  assert.throws(()=>inside(root,'.'));
});
