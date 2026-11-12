const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2] || 8882);
const allowed = new Set(['index.html', 'PAINEL_TRIBUTARIO_CNPJ_67073133000169.html', '404.html', '.nojekyll']);
const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.ttf':'font/ttf', '.txt':'text/plain; charset=utf-8' };
http.createServer((req,res)=>{
 let file;
 try { file = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1) || 'index.html'; } catch { res.writeHead(400); return res.end(); }
 const full = path.resolve(root,file);
 if ((!allowed.has(file) && !file.startsWith('assets/')) || !full.startsWith(root+path.sep)) { res.writeHead(404); return res.end(); }
 fs.readFile(full,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':types[path.extname(full)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
}).listen(port,'127.0.0.1',()=>console.log('Static preview: http://127.0.0.1:'+port));
