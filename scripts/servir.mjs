#!/usr/bin/env node
// Servidor local minimo para previsualizar /sitio: node scripts/servir.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DIR_SITIO } from './lib/util.mjs';

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };

http.createServer((req, res) => {
  let ruta = decodeURIComponent(req.url.split('?')[0]);
  let archivo = path.join(DIR_SITIO, ruta);
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
  if (!fs.existsSync(archivo)) archivo = path.join(DIR_SITIO, '404.html');
  if (!fs.existsSync(archivo)) { res.writeHead(404).end('404'); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
  fs.createReadStream(archivo).pipe(res);
}).listen(8080, () => console.log('▌ http://localhost:8080'));
