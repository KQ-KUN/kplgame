import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderGames,renderUtilities} from '../scripts/portal-view.mjs';

test('game rows follow enabled registry order, paths and analytics markers',()=>{
  const game={id:'demo',name:'KPL Demo',path:'/custom-route/',icon:'shared/demo.svg',category:'分类',accent:'blue',enabled:true};
  const html=renderGames([{...game,enabled:false},game,{...game,id:'second',name:'<Test>',path:'/second/'}]);
  assert.equal((html.match(/class="game-card /g)||[]).length,2);
  assert.match(html,/data-game="demo" href="\/custom-route\/"/);
  assert.match(html,/>01<\/span>/);
  assert.match(html,/>02<\/span>/);
  assert.match(html,/>Demo<\/strong>/);
  assert.match(html,/&lt;Test&gt;/);
  assert.ok(!html.includes('<button'));
});

test('unconfigured utilities show named panels; configured external URLs open safely',async()=>{
  const config=JSON.parse(await fs.readFile(new URL('../config/portal.json',import.meta.url),'utf8'));
  const view=renderUtilities(config);
  assert.equal((view.utilities.match(/class="utility-card"/g)||[]).length,4);
  assert.equal(view.panels,'');
  assert.match(view.utilities, /href="\/cooperation.html"/);
  assert.ok(!view.utilities.includes('data-panel') && !view.utilities.includes('ad-panel'));
  const placeholder=renderUtilities({utilities:[{id:'demo',label:'说明',description:'信息',href:null,panelText:'内容'}]});
  assert.match(placeholder.panels, /aria-labelledby="demo-title" hidden/);
  assert.match(placeholder.utilities, /aria-expanded="false" aria-controls="demo-panel"/);
  assert.match(view.utilities,/href="https:\/\/b23.tv\/T3zXuwt" target="_blank" rel="noopener noreferrer"/);
  assert.match(view.utilities,/href="https:\/\/m.bilibili.com\/opus\/1253349986197831686" target="_blank" rel="noopener noreferrer"/);
  assert.match(view.utilities,/几几华华里/);
  assert.equal((view.utilities.match(/class="utility-icon"/g)||[]).length,4);
  for(const item of config.utilities) {
    assert.match(view.utilities,new RegExp(`src="/${item.icon}" alt=""`));
    const svg=await fs.readFile(new URL(`../public/${item.icon}`,import.meta.url),'utf8');
    assert.match(svg,/<svg /);
    assert.ok(!/<script|<image|https?:\/\/(?!www\.w3\.org)/.test(svg));
  }
  assert.match(view.utilities,/href="\/announcement.html"/);
  assert.ok(!view.utilities.includes('href="#"'));
  const external=renderUtilities({utilities:[{id:'bilibili',label:'B站',description:'更新',href:'https://space.bilibili.com/123?x=1&y=2'}]});
  assert.match(external.utilities,/target="_blank" rel="noopener noreferrer"/);
  assert.match(external.utilities,/x=1&amp;y=2/);
  assert.equal(external.panels,'');
  const uppercase=renderUtilities({utilities:[{id:'external',label:'入口',description:'说明',href:'HTTPS://example.test/'}]});
  assert.match(uppercase.utilities,/target="_blank"/);
});

test('cooperation page shows contact information without scripts, dialogs or advertising ids',async()=>{
  const template=await fs.readFile(new URL('../portal/cooperation.html',import.meta.url),'utf8');
  const config=JSON.parse(await fs.readFile(new URL('../config/portal.json',import.meta.url),'utf8'));
  const contact=config.utilities.find(item=>item.id==='ad');
  assert.equal(contact.href,'/cooperation.html');
  assert.match(contact.panelText,/添加 WX：hkq2297409816（备注来意）/);
  assert.match(template,/\{\{cooperationText\}\}/);
  assert.match(template,/href="\/">← 返回游戏中心/);
  assert.ok(!/<script\b|<dialog\b|\bhidden\b|\bid="ad[-"]/i.test(template));
});

test('utility config rejects executable URLs, protocol-relative URLs and duplicate ids',()=>{
  const item={id:'demo',label:'入口',description:'说明',href:null,panelText:'说明'};
  for(const href of ['javascript:alert(1)','//example.test','http://example.test','https://user:secret@example.test']) {
    assert.throws(()=>renderUtilities({utilities:[{...item,href}]}));
  }
  assert.throws(()=>renderUtilities({utilities:[item,item]}));
  for(const icon of ['https://example.test/icon.svg','shared/../icon.svg','shared/icon.svg" onerror="alert(1)']) {
    assert.throws(()=>renderUtilities({utilities:[{...item,icon}]}));
  }
});
