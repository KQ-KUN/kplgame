const object=value=>value!==null && typeof value==='object' && !Array.isArray(value);
const rows=(value,key)=>Array.isArray(value?.[key]) && value[key].length>0;
const players=value=>rows(value,'players') && value.players.every(p=>object(p) && typeof (p.id??p.player_id)==='string');

// Contracts describe runtime dependencies, independently of bundler file hashes.
export const smokeContracts={
  portal:{markers:[/class=["'][^"']*\bhub\b/,/class=["'][^"']*\bgame-grid\b/],scripts:['portal.js'],data:[]},
  kpl2k:{markers:[/id=["']btn-classic["']/,/id=["']team["']/],scripts:['js/engine.js','js/data.js','js/ui.js','js/budget.js','js/bgm.js','js/narrative.js'],data:[
    ['data/manifest.json',d=>rows(d,'seasons') && d.seasons.every(s=>typeof s.season_id==='string' && typeof s.name==='string') && rows(d,'teams2026') && d.teams2026.every(t=>typeof t.id==='string' && typeof t.name==='string')],
    ['data/base.json',d=>rows(d,'franchises') && d.franchises.every(t=>typeof t.id==='string') && object(d.players) && Object.keys(d.players).length>0 && object(d.narrative?.templates)],
    ['data/all_star.json',d=>rows(d,'players')],['data/budget_pairs.json',d=>object(d.pairs)]
  ]},
  guessing:{markers:[/id=["']guess-form["']/,/id=["']genius-root["']/],bundled:true,data:[
    ['data/quiz_players.json',d=>d.schemaVersion===1 && players(d) && d.players.every(p=>typeof p.nickname==='string' && Array.isArray(p.positions))],
    ['data/player_library.json',players]
  ]},
  link:{markers:[/id=["']path-board["']/,/id=["']submit-path["']/],bundled:true,data:[
    ['data/players.json',d=>d.schemaVersion===1 && players(d)],
    ['data/link_graph.json',d=>d.schemaVersion===1 && object(d.adjacency) && Object.keys(d.adjacency).length>0 && Object.values(d.adjacency).every(Array.isArray) && (object(d.evidence)||object(d.latestYear))]
  ]},
  // Merge's team snapshot is embedded in its bundle; browser smoke validates the rendered pool.
  merge:{markers:[/id=["']team-grid["']/,/id=["']arena["']/],bundled:true,data:[],assets:[
    ['team-icons/10001.png',[137,80,78,71]],['team-audio/normal/10001.m4a',[null,null,null,null,102,116,121,112]]
  ]},
  coin:{markers:[/id=["']match-card["']/,/id=["']start["']/],scripts:['src/app.js'],bundled:true,data:[
    ['release.json',d=>typeof d.build_id==='string' && typeof d.runtime_sha256==='string'],
    ['data/coin-ui-v1.json',d=>d.schema_version==='coin-ui-1.0.0' && rows(d,'matches') && Array.isArray(d.columns) && rows(d,'teams')],
    ['data/assets-manifest.json',d=>object(d.assets) && typeof d.canonical_ledger_sha256==='string'],
    ['data/coin-official-v2.1.json',d=>d.schema_version==='coin-official-2.1.0' && rows(d,'matches') && Array.isArray(d.columns) && rows(d,'teams')],
    ['data/official-manifest-v2.1.json',d=>d.schema_version==='coin-official-2.1.0' && typeof d.sha256==='string']
  ]}
};

export function matchesBinarySignature(bytes,signature) {
  return bytes.length>0 && (!signature || signature.every((byte,i)=>byte===null || bytes[i]===byte));
}

export function scriptDependencies(js) {
  const references=new Set();
  for(const pattern of [/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+\.(?:m?js|css)(?:\?[^"']*)?)["']/g]) {
    for(const match of js.matchAll(pattern)) references.add(match[1]);
  }
  return [...references];
}

export function validateContract(owner,html,resources,pageURL) {
  const contract=smokeContracts[owner];
  if(!contract) return [`${owner}: 缺少入口和资源契约`];
  const failures=[];
  for(const marker of contract.markers) if(!marker.test(html)) failures.push(`${owner}: 缺少入口识别标记 ${marker}`);
  const hasScript=script=>resources.some(reference=>{
    const actual=new URL(reference),expected=new URL(script,pageURL);
    return actual.origin===expected.origin && actual.pathname===expected.pathname;
  });
  for(const script of contract.scripts??[]) if(!hasScript(script)) failures.push(`${owner}: 页面未加载关键模块 ${script}`);
  if(owner==='kpl2k' && /id=["']core-load-status["']/.test(html) && !hasScript('js/bootstrap.js')) failures.push(`${owner}: 页面未加载关键模块 js/bootstrap.js`);
  if(contract.bundled && !/<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["'][^"']+\.js)[^>]*>/i.test(html)) failures.push(`${owner}: 缺少主 module 入口`);
  return failures;
}
