import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {expectedHeaders} from '../scripts/runtime-security.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),output=path.join(root,'dist');

const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    let file=path.resolve(output,'.'+(pathname==='/'?'/index.html':pathname));
    if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
    if(!file.startsWith(output+path.sep))throw Error('outside');
    const content=await fs.readFile(file);res.writeHead(200,{...expectedHeaders,'Content-Type':mime[path.extname(file)]??'application/octet-stream'});res.end(content);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const {chromium}=createRequire(import.meta.url)(process.env.KPL_PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const checks=[],errors=[],blockedExternal=[];
async function setup({bot=false,fail=false}={}){
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),events=[];
  await c.addInitScript(bot=>Object.defineProperty(navigator,'webdriver',{get:()=>bot}),bot);
  c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  await c.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin){blockedExternal.push(url.origin);return route.abort();}
    if(url.pathname.startsWith('/__event/')){
      events.push(url.pathname.split('/').at(-1).replace('.txt',''));
      return fail?route.abort():route.fulfill({status:200,body:'ok\n'});
    }
    return route.continue();
  });
  return {c,events,p:await c.newPage()};
}
const count=(list,name)=>list.filter(e=>e===name).length;
const home=p=>p.locator('.brand[data-action="home"]').click();
const settle=async p=>{await p.locator('#loyal-controls [data-action="finish"]').click();await p.locator('#result').waitFor({state:'visible'});};
try{
  const {c,p,events}=await setup();await p.goto(origin+'/');
  await p.locator('.game-card[data-game="coin"]').click();await p.waitForURL(origin+'/coin/');await p.locator('#team-grid button').first().waitFor();
  await p.locator('#start').click();await settle(p);await p.waitForFunction(()=>document.querySelector('#result').hidden===false);
  await home(p);await p.locator('#resume-game').click();await p.locator('#result').waitFor({state:'visible'});
  await home(p);await p.reload();await p.locator('#resume-game').click();await p.locator('#result').waitFor({state:'visible'});
  await p.locator('#result [data-action="restart"]').click();await p.locator('#play').waitFor({state:'visible'});
  await p.locator('#recap').click();await settle(p);
  await p.locator('#result [data-action="copy"]').click();
  await p.waitForTimeout(100);
  assert.equal(count(events,'portal-click-coin'),1);assert.equal(count(events,'pageview-coin'),2);
  assert.equal(count(events,'coin-start'),2);assert.equal(count(events,'coin-complete'),2);
  assert.equal(count(events,'coin-resume'),2);assert.equal(count(events,'coin-restart'),1);assert.equal(count(events,'coin-recap'),1);assert.equal(count(events,'coin-copy'),1);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  checks.push({check:'real compiled game: portal entry, new round, finish, repeated completed-save restore, replay, recap, copy',events});
  await c.close();
  const direct=await setup();await direct.p.goto(origin+'/coin/?utm_source=bilibili');await direct.p.locator('#team-grid button').first().waitFor();
  await direct.p.locator('[data-action="mode"][data-mode="trader"]').click();await direct.p.locator('#challenge-team').selectOption({index:1});
  await direct.p.waitForTimeout(100);assert.equal(count(direct.events,'source-bilibili'),1);assert.equal(count(direct.events,'coin-select-mode'),1);assert.equal(count(direct.events,'coin-select-team'),1);checks.push({check:'Coin direct UTM, mode and team selection',events:direct.events});await direct.c.close();
  const bot=await setup({bot:true});await bot.p.goto(origin+'/coin/?utm_source=bilibili');await bot.p.locator('#start').click();await settle(bot.p);assert.deepEqual(bot.events,[]);checks.push({check:'webdriver suppresses all real compiled game events'});await bot.c.close();
  const fail=await setup({fail:true});await fail.p.goto(origin+'/coin/');await fail.p.locator('#start').click();await settle(fail.p);assert.equal(count(fail.events,'coin-start'),1);assert.equal(count(fail.events,'coin-complete'),1);checks.push({check:'event network failure does not interrupt real round or settlement'});await fail.c.close();
  assert.deepEqual(errors,[]);assert.deepEqual(blockedExternal,[]);
}finally{
  const result={checks,errors,blockedExternal,browser:browser.version(),productionEventRequests:0};
  await fs.mkdir(path.join(root,'reports'),{recursive:true});await fs.writeFile(path.join(root,'reports/coin-analytics-browser.json'),JSON.stringify(result,null,2));
  await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));
}
console.log(JSON.stringify({checks,errors,blockedExternal,productionEventRequests:0},null,2));
