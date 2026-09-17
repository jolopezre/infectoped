#!/usr/bin/env node
/**
 * PASO 4 — Construccion del sitio estatico en /sitio.
 * Este es el comando que ejecuta Netlify en cada despliegue.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as P from './lib/plantillas.mjs';
import { paginaSuscribirse } from './lib/suscribirse.mjs';
import {
  DIR_SITIO, DIR_PUBLICO, rutaDe, leerJSON, asegurarDir,
  listarArticulos, log,
} from './lib/util.mjs';

const sitio = leerJSON(rutaDe('config', 'sitio.json'));
sitio.url = (process.env.SITIO_URL || process.env.URL || sitio.url).replace(/\/$/, '');

log.titulo('Construyendo el sitio');

fs.rmSync(DIR_SITIO, { recursive: true, force: true });
asegurarDir(DIR_SITIO);

// 1. Copiar estaticos
if (fs.existsSync(DIR_PUBLICO)) fs.cpSync(DIR_PUBLICO, DIR_SITIO, { recursive: true });

// 2. Cargar articulos publicados
const todos = listarArticulos().filter((a) => a.estado === 'publicado' || a.estado === 'resumido');
log.info(`${todos.length} artículos publicables`);

const escribir = (ruta, contenido) => {
  const destino = path.join(DIR_SITIO, ruta);
  asegurarDir(path.dirname(destino));
  fs.writeFileSync(destino, contenido, 'utf8');
};

// 2b. Imagen Open Graph por defecto: la infografia mas reciente
const ogDestino = path.join(DIR_SITIO, 'img', 'og-principal.png');
const ogOrigen = todos.find((a) => a.infografia)?.infografia;
if (ogOrigen && fs.existsSync(path.join(DIR_SITIO, ogOrigen))) {
  asegurarDir(path.dirname(ogDestino));
  fs.copyFileSync(path.join(DIR_SITIO, ogOrigen), ogDestino);
}

// 3. Portada
escribir('index.html', P.base({
  sitio, ruta: '/', titulo: sitio.nombre, descripcion: sitio.descripcion,
  contenido: P.portada({ sitio, articulos: todos }),
  claseCuerpo: 'pagina-inicio',
}));

// 4. Fichas de articulo
for (const a of todos) {
  const relacionados = todos
    .filter((o) => o.id !== a.id && (o.temas || []).some((t) => (a.temas || []).includes(t)))
    .slice(0, 3);
  escribir(`articulo/${a.id}/index.html`, P.base({
    sitio, ruta: `/articulo/${a.id}/`,
    titulo: a.tituloEs || a.titulo,
    descripcion: a.sintesis,
    imagen: a.infografia,
    contenido: P.paginaArticulo({ sitio, a, relacionados }),
  }));
}

// 5. Archivo, galeria, temas, acerca, 404
const temas = [...new Set(todos.flatMap((a) => a.temas || []))].sort();
escribir('articulos/index.html', P.base({
  sitio, ruta: '/articulos/', titulo: 'Archivo de artículos',
  descripcion: 'Todo el archivo de INFECTOPED: enfermedades infecciosas pediátricas.',
  contenido: P.paginaArchivo({ articulos: todos, temas }),
}));

escribir('infografias/index.html', P.base({
  sitio, ruta: '/infografias/', titulo: 'Galería de infografías',
  descripcion: 'Infografías descargables sobre enfermedades infecciosas pediátricas.',
  contenido: P.paginaInfografias({ articulos: todos }),
}));

const porTema = Object.fromEntries(temas.map((t) => [t, todos.filter((a) => (a.temas || []).includes(t))]));
escribir('temas/index.html', P.base({
  sitio, ruta: '/temas/', titulo: 'Temas',
  descripcion: 'El archivo organizado por líneas temáticas.',
  contenido: P.paginaTemas({ porTema }),
}));

escribir('acerca/index.html', P.base({
  sitio, ruta: '/acerca/', titulo: 'Acerca de',
  descripcion: 'Método de búsqueda, selección y redacción de INFECTOPED.',
  contenido: P.paginaAcerca({ sitio }),
}));

escribir('suscribirse/index.html', P.base({
  sitio, ruta: '/suscribirse/', titulo: 'Suscribirse',
  descripcion: 'Sigue INFECTOPED por RSS: cada cuatro días, evidencia en infectología pediátrica.',
  contenido: paginaSuscribirse({ sitio }),
}));

escribir('404.html', P.base({ sitio, ruta: '/404', titulo: 'No encontrado', contenido: P.pagina404() }));

// 6. RSS, sitemap, indice de busqueda
escribir('feed.xml', P.feed({ sitio, articulos: todos }));

const rutas = ['/', '/articulos/', '/infografias/', '/temas/', '/acerca/', '/suscribirse/', ...todos.map((a) => `/articulo/${a.id}/`)];
escribir('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas.map((r) => `  <url><loc>${sitio.url}${r}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>`);

escribir('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${sitio.url}/sitemap.xml\n`);

escribir('indice.json', JSON.stringify(todos.map((a) => ({
  id: a.id, titulo: a.tituloEs || a.titulo, revista: a.revista,
  temas: a.temas, etiquetas: a.etiquetas, sintesis: a.sintesis,
  fecha: a.publicadoEl, infografia: a.infografia,
}))));

log.ok(`Sitio construido en /sitio — ${rutas.length} páginas`);
