import {escapeHTML as e} from './common.mjs';

export function renderGames(games) {
  return games.filter(g=>g.enabled).map((g,index)=>`<a class="game-card game-card--${e(g.accent)}" data-game="${e(g.id)}" href="${e(g.path)}"><span class="game-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><span class="avatar-wrap"><img src="/${e(g.icon)}" alt="" width="48" height="48"></span><span class="card-copy"><strong${/[\u3400-\u9fff]/.test(g.name)?'':' lang="en"'}>${e(g.name.replace(/^KPL\s+/,''))}</strong><span class="game-type">${e(g.category)}</span></span><span class="enter"><span class="enter-label">进入</span><span aria-hidden="true">→</span></span></a>`).join('\n');
}

export function renderUtilities({utilities}) {
  if(!Array.isArray(utilities)) throw new Error('Portal 辅助入口必须为数组');
  const ids=new Set();
  const panels=[];
  const links=utilities.map(item=>{
    if(!/^[a-z][a-z0-9-]*$/.test(item.id) || ids.has(item.id)) throw new Error('无效或重复的辅助入口 id');
    ids.add(item.id);
    for(const key of ['label','description']) if(typeof item[key]!=='string' || !item[key].trim()) throw new Error(`辅助入口缺少 ${key}`);
    if(item.icon!==undefined && (typeof item.icon!=='string' || !/^shared\/[a-z0-9-]+\.svg$/.test(item.icon))) throw new Error('辅助入口图标必须为本地 shared SVG');
    const icon=item.icon?`<img class="utility-icon" src="/${e(item.icon)}" alt="" width="24" height="24">`:'';
    const content=`<span class="utility-content">${icon}<span class="utility-copy"><strong>${e(item.label)}</strong><span>${e(item.description)}</span></span></span>`;
    if(item.href!==null) {
      // Only same-origin paths or real HTTPS destinations; no fake or script links.
      if(typeof item.href!=='string' || !(/^(?:\/[a-z0-9][a-z0-9/._-]*|https:\/\/[^\s]+)$/i.test(item.href))) throw new Error('辅助入口仅支持站内路径或 HTTPS 链接');
      const external=/^https:\/\//i.test(item.href);
      if(external) {
        const url=new URL(item.href);
        if(url.username || url.password) throw new Error('辅助入口 URL 不允许凭据');
      }
      return `<a class="utility-card" href="${e(item.href)}"${external?' target="_blank" rel="noopener noreferrer"':''}>${content}${external?'<span class="sr-only">（在新标签页打开）</span>':''}</a>`;
    }
    if(typeof item.panelText!=='string' || !item.panelText.trim()) throw new Error('占位入口缺少说明');
    panels.push(`<section class="utility-panel" id="${e(item.id)}-panel" aria-labelledby="${e(item.id)}-title" hidden><h2 id="${e(item.id)}-title">${e(item.label)}</h2><p>${e(item.panelText)}</p><div class="panel-actions"><button type="button" class="close-panel">关闭</button></div></section>`);
    return `<button type="button" class="utility-card" data-panel="${e(item.id)}-panel" aria-expanded="false" aria-controls="${e(item.id)}-panel">${content}</button>`;
  });
  return {utilities:links.join('\n'),panels:panels.join('\n')};
}
