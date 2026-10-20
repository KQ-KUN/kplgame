import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {registry} from './common.mjs';

export async function smokeBrowser({origin='https://kplgame.cn',games,chromium:provided,channel=process.env.KPL_BROWSER_CHANNEL}={}) {
  let chromium=provided;
  if(!chromium) {
    try {chromium=createRequire(import.meta.url)(process.env.KPL_PLAYWRIGHT_PATH||'playwright').chromium;}
    catch {throw new Error('浏览器 smoke 缺少 Playwright。运行 npm ci，或设置 KPL_PLAYWRIGHT_PATH 指向已有运行时；该阶段不能标为通过。');}
  }
  const browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--disable-back-forward-cache'],...(channel?{channel}:{})});
  const checks=[],failures=[],blockedEvents=[],limitations=[];
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  try {
    await context.addInitScript(()=>{
      Object.defineProperty(navigator,'webdriver',{get:()=>true});
      localStorage.setItem('kpl2k_disclaimer_v1','1');
    });
    // A second barrier prevents product telemetry even if a future helper regresses.
    await context.route('**/*',route=>{
      if(new URL(route.request().url()).pathname.startsWith('/__event/')) {
        blockedEvents.push(route.request().url());return route.fulfill({status:204,body:''});
      }
      return route.continue();
    });
    const entries=games??(await registry()).filter(g=>g.enabled);
    const page=await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror',error=>failures.push(error.message));
    await page.goto(origin,{waitUntil:'networkidle'});
    const first=entries[0];
    if(first) {
      await page.locator(`.game-card[data-game="${first.id}"]`).click();
      await page.waitForURL(new URL(first.path,origin).href);
      checks.push('portal: game card navigates');
    }
    for(const game of entries) {
      await page.goto(new URL(game.path,origin).href,{waitUntil:'networkidle'});
      if(game.id==='kpl2k') {
        await page.locator('#btn-quick').click();
        await page.locator('#sim-skip').waitFor({state:'visible'});
        await page.waitForFunction(()=>!document.querySelector('#sim-loading'));
        await page.locator('#sim-skip').click();await page.locator('#cf-ok').click();
        await page.waitForFunction(()=>document.querySelector('#result')?.classList.contains('active')||document.querySelector('#sim-next')?.offsetParent!==null);
        if(await page.locator('#sim-next').isVisible())await page.locator('#sim-next').click();
        await page.locator('#result.show, #result.active').waitFor();
        checks.push('kpl2k: daily lineup, complete simulation and result');
      } else if(game.id==='guessing') {
        await page.locator('a[href="#classic"]').first().click();
        await page.locator('#guess-input').fill('Fly');
        await page.locator('#suggestions .suggestion').first().click();
        await page.locator('#submit-button').click();
        await page.locator('#board .guess-row').first().waitFor();
        checks.push('guessing: search and submit produces feedback');
      } else if(game.id==='link') {
        await page.locator('#game-content').waitFor({state:'visible'});
        await page.locator('[data-insert-index]').first().click();
        await page.locator('#player-search').fill('Fly');
        await page.locator('#player-options [role="option"]').first().waitFor();
        await page.locator('#player-search').press('ArrowDown');await page.locator('#player-search').press('Enter');
        await page.locator('.remove-node').waitFor();
        await page.locator('#submit-path').click();
        await page.locator('#result-panel').waitFor({state:'visible'});
        checks.push('link: keyboard search, add player and validate path');
      } else if(game.id==='merge') {
        const teams=page.locator('#team-grid button[data-team]');
        await teams.first().waitFor();
        const ids=await teams.evaluateAll(nodes=>nodes.map(node=>node.dataset.team));
        if(ids.length!==12 || new Set(ids).size!==12) throw new Error('merge: 队伍快照结构不完整');
        await teams.first().click();await page.locator('#start').click();
        const canvas=page.locator('#arena');await canvas.focus();await canvas.press('Space');
        await page.waitForFunction(()=>Boolean(document.querySelector('#arena')?.dataset.team));
        await page.locator('#pause').click();
        const frozen=await page.evaluate(()=>{
          const canvas=document.querySelector('#arena');window.__smokeCanvas=canvas;
          window.__smokeRead=()=>JSON.stringify({data:{...canvas.dataset},pixels:canvas.toDataURL(),pause:document.querySelector('#pause').textContent});
          const state=window.__smokeRead();
          for(let n=0;n<3;n++){dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));}
          if(window.__smokeCanvas!==document.querySelector('#arena')||state!==window.__smokeRead())throw Error('merge: repeated lifecycle changed paused canvas/queue');
          return state;
        });
        await page.goto(new URL('/?history-smoke=1',origin).href);await page.goBack({waitUntil:'commit'});
        await page.waitForFunction(()=>document.querySelectorAll('#team-grid button').length===12);
        if(await page.evaluate(()=>Boolean(window.__smokeCanvas))) {
          if(frozen!==await page.evaluate(()=>window.__smokeRead()))throw new Error('merge: cached history lost paused progress');
          checks.push('merge: native history preserved cached session');
        } else {
          limitations.push('merge: history navigation executed; this routed aggregate context missed BFCache, so native restore is unverified here');
          await page.locator('#team-grid button[data-team]').first().click();await page.locator('#start').click();
        }
        await page.locator('#restart').click();
        checks.push('merge: 12 teams, drop, pause, repeated page lifecycle preserves state and restart');
      } else if(game.id==='coin') {
        await page.locator('#team-grid button[data-team]').first().waitFor();
        await page.locator('[data-action="mode"][data-mode="trader"]').click();
        await page.locator('#start').click();
        await page.locator('#match-card').waitFor({state:'visible'});
        await page.locator('[data-action="side"][data-choice="a"]').click();await page.locator('#confirm').click();
        await page.waitForFunction(()=>document.querySelector('#match-card').dataset.phase==='result');
        const balance=await page.locator('#balance').textContent();
        await page.locator('.brand[data-action="home"]').click();await page.reload();
        if(await page.locator('#resume-game').count()) {
          await page.locator('#resume-game').click();await page.locator('#play').waitFor({state:'visible'});
          if(balance!==await page.locator('#balance').textContent())throw new Error('coin: restored balance changed');
          checks.push('coin: select, choose, settle, refresh and resume same balance');
        } else checks.push('coin: select, choose, settle (registered legacy version has no checkpoint feature)');
      } else throw new Error(`${game.id}: 缺少浏览器操作契约`);
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) failures.push(`${game.id}: 390px horizontal overflow`);
      // Direct subpath refresh must retain a working standalone document.
      await page.reload({waitUntil:'networkidle'});
      await page.keyboard.press('Tab');
      if(!await page.evaluate(()=>document.activeElement!==document.body)) failures.push(`${game.id}: no keyboard focus`);
    }
    for(const [id,resource,retry,ready] of [
      ['kpl2k','data/base.json','#core-load-retry','#btn-quick'],
      ['link','data/players.json','#retry-load','#game-content'],
      ['coin','data/coin-official-v2.1.json','#reload','#team-grid button']
    ]) {
      const game=entries.find(g=>g.id===id);if(!game)continue;
      const fault=await context.newPage();let fail=true;
      await fault.route(new URL(resource,new URL(game.path,origin)).href,route=>fail?route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html>fallback</html>'}):route.continue());
      fault.on('pageerror',error=>failures.push(`${id} recovery: ${error.message}`));
      await fault.goto(new URL(game.path,origin).href);
      await fault.locator(retry).waitFor({state:'visible'});fail=false;await fault.locator(retry).click();await fault.locator(ready).first().waitFor({state:'visible'});
      if(id==='kpl2k')await fault.waitForFunction(()=>document.body.dataset.loadState==='ready');
      if(id==='kpl2k' && !await fault.locator('#btn-quick').isEnabled())throw new Error('kpl2k: retry did not enable entry');
      checks.push(`${id}: fallback HTML rejected, explicit retry recovers`);await fault.close();
    }
    const guessing=entries.find(g=>g.id==='guessing');
    if(guessing) {
      const fault=await context.newPage();let fail=true;
      await fault.route('**/data/quiz_players.json',route=>fail?route.fulfill({status:503,body:'unavailable'}):route.continue());
      await fault.goto(new URL(guessing.path,origin).href);
      if(await fault.locator('[data-retry="classic"]').count()) {
        await fault.locator('a[href="#classic"]').first().click();
        await fault.locator('[data-retry="classic"]').waitFor({state:'visible'});
        fail=false;await fault.locator('[data-retry="classic"]').click();
        await fault.locator('#guess-input').waitFor({state:'visible'});
        checks.push('guessing: mode data failure and explicit retry recover');
      } else limitations.push('guessing: registered legacy version lacks per-mode retry; not validated');
      await fault.close();
    }
    if(blockedEvents.length) failures.push('统计 helper 尝试发送事件，已在网络层阻断');
    if(failures.length) throw new Error(`浏览器 smoke 失败: ${failures.join('; ')}`);
    return {ok:true,checks,failures,blockedEvents,limitations,viewport:390};
  } finally {await context.close();await browser.close();}
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  smokeBrowser({origin:process.argv[2]||undefined}).then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error);process.exitCode=1;});
}
