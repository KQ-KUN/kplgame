import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {dist} from './common.mjs';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'};
http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=path.resolve(dist,'.'+pathname);
    if(file!==dist&&!file.startsWith(dist+path.sep)) throw new Error('outside');
    if((await fs.stat(file)).isDirectory()) file=path.join(file,'index.html');
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(await fs.readFile(file));
  } catch {res.writeHead(404);res.end('Not Found');}
}).listen(4173,'127.0.0.1',()=>console.log('KPL GAME http://127.0.0.1:4173'));
