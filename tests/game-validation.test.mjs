import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gameValidation} from '../scripts/game-validation.mjs';
test('legacy static and independent static releases use their own validation contracts',()=>{
 const legacy={build:{type:'static',test:['node','tools/verify_engine.js']}};
 assert.deepEqual(gameValidation(legacy,null).test,legacy.build.test);
 assert.equal(gameValidation(legacy,{scripts:{build:'legacy hub'}}).build,null);
 const current=gameValidation(legacy,{kplgame:{standaloneBuild:true},scripts:{build:'node tools/build_game.mjs'}});
 assert.deepEqual(current.test,['npm','test']);assert.deepEqual(current.build,['npm','run','build']);assert.equal(current.install,true);
});
test('typecheck executes once when the documented npm build already includes it',()=>{
 const game={build:{type:'npm',test:['npm','test'],args:['--base=./']}};
 const plan=gameValidation(game,{scripts:{typecheck:'tsc --noEmit',build:'npm run typecheck && vite build'}});
 assert.equal(plan.typecheck,null);assert.deepEqual(plan.build,['npm','run','build','--','--base=./']);
 assert.deepEqual(gameValidation(game,{scripts:{typecheck:'tsc --noEmit',build:'vite build'}}).typecheck,['npm','run','typecheck']);
});
