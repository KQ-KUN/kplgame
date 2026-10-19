export const portalHTML='<html><main class="hub"><section class="game-grid"></section></main><link rel="stylesheet" href="/portal.css"><script src="/portal.js"></script><link rel="icon" href="/favicon.ico"></html>';
export const linkHTML='<html><div id="path-board"></div><button id="submit-path"></button><script type="module" src="./assets/main.js"></script></html>';
export function mockSite(overrides={}) {
  const seen=[];
  const bodies={
    '/':portalHTML,'/portal.js':'(()=>{})();','/portal.css':'body{color:black}',
    '/link/':linkHTML,'/link/assets/main.js':'import "./chunk.js";fetch("./data/players.json")',
    '/link/assets/chunk.js':'export const ready=true;',
    '/link/data/players.json':JSON.stringify({schemaVersion:1,players:[{id:'p'}]}),
    '/link/data/link_graph.json':JSON.stringify({schemaVersion:1,adjacency:{p:[]},evidence:{}}),
    ...overrides
  };
  return {seen,fetcher:async url=>{
    const pathname=new URL(url).pathname;seen.push(pathname);
    const body=bodies[pathname];
    return {status:body===undefined?404:200,text:async()=>body};
  }};
}
