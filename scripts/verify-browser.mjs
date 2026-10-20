import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {dist,root} from './common.mjs';
import {smokeBrowser} from './smoke-browser.mjs';
import {smokeProduction} from './smoke-production.mjs';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.m4a':'audio/mp4','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
  let file=path.resolve(dist,'.'+pathname);
  if(file!==dist&&!file.startsWith(dist+path.sep))throw Error('outside');
  if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end('Not Found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{
 const origin=`http://127.0.0.1:${server.address().port}`;
 const httpResult=await smokeProduction({origin,checkHeaders:false});
 const result=await smokeBrowser({origin});
 await fs.mkdir(path.join(root,'reports'),{recursive:true});
 await fs.writeFile(path.join(root,'reports/browser-regression.json'),JSON.stringify(result,null,2)+'\n');
 await fs.writeFile(path.join(root,'reports/local-http-smoke.json'),JSON.stringify(httpResult,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
}finally{await new Promise(r=>server.close(r));}
