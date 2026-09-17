#!/usr/bin/env node
/**
 * PASO 3 — Genera la infografia PNG de cada articulo.
 * Renderiza plantillas/infografia.html con Playwright (Chromium)
 * y guarda la imagen en publico/img/infografias/.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  DIR_ARTICULOS, DIR_PUBLICO, DIR_PLANTILLAS, rutaDe,
  leerJSON, escribirJSON, asegurarDir, log,
} from './lib/util.mjs';

const ANCHO = 1080;
const ALTO = 1350;
const DESTINO = asegurarDir(path.join(DIR_PUBLICO, 'img', 'infografias'));
const sitio = leerJSON(rutaDe('config', 'sitio.json'), {});

const archivos = fs.existsSync(DIR_ARTICULOS)
  ? fs.readdirSync(DIR_ARTICULOS).filter((f) => f.endsWith('.json'))
  : [];

const pendientes = archivos
  .map((f) => ({ archivo: path.join(DIR_ARTICULOS, f), datos: leerJSON(path.join(DIR_ARTICULOS, f)) }))
  .filter(({ datos }) => datos && datos.estado === 'resumido' && Array.isArray(datos.tips));

log.titulo(`Infografias — ${pendientes.length} por generar`);
if (!pendientes.length) process.exit(0);

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { log.error('Playwright no esta instalado. Ejecuta: npm i -D playwright && npx playwright install chromium'); process.exit(1); }

const plantilla = fs.readFileSync(path.join(DIR_PLANTILLAS, 'infografia.html'), 'utf8');
// CHROMIUM_EJECUTABLE permite apuntar a un Chromium ya instalado en el sistema.
const opciones = { args: ['--no-sandbox', '--font-render-hinting=none'] };
if (process.env.CHROMIUM_EJECUTABLE) opciones.executablePath = process.env.CHROMIUM_EJECUTABLE;
const navegador = await chromium.launch(opciones);
const contexto = await navegador.newContext({ viewport: { width: ANCHO, height: ALTO }, deviceScaleFactor: 2 });

for (const { archivo, datos } of pendientes) {
  const pagina = await contexto.newPage();
  const cargaUtil = {
    titulo: datos.fraseInfografia || datos.tituloEs || datos.titulo,
    tema: (datos.temas && datos.temas[0]) || 'Docencia médica',
    tips: datos.tips,
    revista: datos.revista,
    fechaPublicacion: datos.fechaPublicacion,
    autores: datos.autores,
    pmid: datos.pmid,
    semana: datos.semana,
    nivelEvidencia: datos.nivelEvidencia,
    sitio: (sitio.url || '').replace(/^https?:\/\//, ''),
  };

  const html = plantilla.replaceAll('__DATOS__', JSON.stringify(cargaUtil).replace(/</g, '\\u003c'));
  await pagina.setContent(html, { waitUntil: 'networkidle' });
  await pagina.waitForFunction(() => document.documentElement.dataset.listo === '1', { timeout: 15000 }).catch(() => {});

  const nombre = `${datos.id}.png`;
  await pagina.screenshot({ path: path.join(DESTINO, nombre), type: 'png' });
  await pagina.close();

  escribirJSON(archivo, { ...datos, estado: 'publicado', infografia: `/img/infografias/${nombre}` });
  log.ok(nombre);
}

await navegador.close();
log.titulo('Infografias generadas');
