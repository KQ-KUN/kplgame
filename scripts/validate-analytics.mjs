import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {eventNames} from './analytics-events.mjs';
const required={kpl2k:['start','complete'],guessing:['start','complete','restart'],link:['start','complete','reveal','restart'],merge:['start','favorite','restart','gameover'],coin:['start','complete','restart','resume']};
export async function validateAnalytics(output,games){
  const errors=[],script=await fs.readFile(path.join(output,'shared/analytics.js'),'utf8');
  for(const game of games){
    if(!required[game.id])errors.push(`${game.id}: missing necessary-event contract`);
    const calls=[],window={};
    const context={window,location:{pathname:game.path,search:''},navigator:{webdriver:false},fetch:url=>{calls.push(url);return Promise.resolve();},document:{addEventListener(){}},Element:class{},URLSearchParams};
    vm.runInNewContext(script,context,{timeout:1000});
    if(calls.filter(p=>p===`/__event/pageview-${game.id}.txt`).length!==1)errors.push(`${game.id}: missing pageview`);
    for(const name of [`portal-click-${game.id}`,...(required[game.id]??[]).map(e=>`${game.id}-${e}`)]){
      if(!eventNames.includes(name)||window.KPLAnalytics?.trackEvent(name)!==true)errors.push(`${game.id}: missing event ${name}`);
    }
    const html=await fs.readFile(path.join(output,game.path,'index.html'),'utf8').catch(()=> '');
    if(!html.includes('/shared/analytics.js'))errors.push(`${game.id}: missing injected helper`);
    const dir=path.join(output,game.path);
    async function scripts(folder){
      const found=[];for(const e of await fs.readdir(folder,{withFileTypes:true})){if(e.isDirectory())found.push(...await scripts(path.join(folder,e.name)));else if(/\.(?:js|mjs)$/.test(e.name))found.push(await fs.readFile(path.join(folder,e.name),'utf8'));}return found;
    }
    const code=(await scripts(dir)).join('\n');
    for(const action of required[game.id]??[])if(!code.includes(`${game.id}-${action}`))errors.push(`${game.id}: missing business hook ${action}`);
    if(game.id==='coin'){
      const release=JSON.parse(await fs.readFile(path.join(dir,'release.json'),'utf8'));
      if(release.analytics_enabled!==true)errors.push('coin: analytics switch disabled');
    }
  }
  return errors;
}
