import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {registry} from './common.mjs';

export async function smokeBrowser({origin='https://kplgame.cn',games,chromium:provided,channel=process.env.KPL_BROWSER_CHANNEL}={}) {
  let chromium=provided;
  if(!chromium) {
    try {chromium=createRequire(import.meta.url)(process.env.KPL_PLAYWRIGHT_PATH||'playwright').chromium;}
    catch {throw new Error('浏览器 smoke 缺少 Playwright。运行 npm ci，或设置 KPL_PLAYWRIGHT_PATH 指向已有运行时；该阶段不能标为通过。');}
  }
  const browser=await chromium.launch({headless:true,...(channel?{channel}:{})});
  const checks=[],failures=[],blockedEvents=[];
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
        await page.locator('#btn-classic').click();
        await page.waitForFunction(()=>document.querySelector('#team')?.classList.contains('active') || document.querySelector('#team')?.classList.contains('show'));
        checks.push('kpl2k: classic team selection opens');
      } else if(game.id==='guessing') {
        await page.locator('a[href="#classic"]').first().click();
        await page.locator('#guess-input').fill('Fly');
        await page.locator('#suggestions .suggestion').first().click();
        await page.locator('#submit-button').click();
        await page.locator('#board .guess-row').first().waitFor();
        checks.push('guessing: search and submit produces feedback');
      } else if(game.id==='link') {
        await page.locator('#game-content').waitFor({state:'visible'});
        await page.locator('#submit-path').click();
        await page.locator('#result-panel').waitFor({state:'visible'});
        checks.push('link: submit produces result');
      } else if(game.id==='merge') {
        const teams=page.locator('#team-grid button[data-team]');
        await teams.first().waitFor();
        const ids=await teams.evaluateAll(nodes=>nodes.map(node=>node.dataset.team));
        if(ids.length!==12 || new Set(ids).size!==12) throw new Error('merge: 队伍快照结构不完整');
        await teams.first().click();await page.locator('#start').click();
        const canvas=page.locator('#arena');await canvas.focus();await canvas.press('Space');
        await page.waitForFunction(()=>Boolean(document.querySelector('#arena')?.dataset.team));
        await page.locator('#pause').click();
        checks.push('merge: 12 unique teams, start, drop and pause');
      } else if(game.id==='coin') {
        await page.locator('#team-grid button[data-team]').first().click();
        await page.locator('#start').click();
        await page.locator('#match-card').waitFor({state:'visible'});
        await page.locator('#toggle').click();
        checks.push('coin: choose team, start replay and pause');
      } else throw new Error(`${game.id}: 缺少浏览器操作契约`);
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) failures.push(`${game.id}: 390px horizontal overflow`);
    }
    if(blockedEvents.length) failures.push('统计 helper 尝试发送事件，已在网络层阻断');
    if(failures.length) throw new Error(`浏览器 smoke 失败: ${failures.join('; ')}`);
    return {ok:true,checks,failures,blockedEvents,viewport:390};
  } finally {await context.close();await browser.close();}
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  smokeBrowser({origin:process.argv[2]||undefined}).then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error);process.exitCode=1;});
}
