#!/usr/bin/env node
/**
 * PASO 1 — Busqueda semanal en PubMed.
 * Recupera candidatos, descarta duplicados, puntua por relevancia
 * y guarda los mejores en contenido/articulos/ con estado "pendiente".
 */
import fs from 'node:fs';
import path from 'node:path';
import * as pubmed from './lib/pubmed.mjs';
import {
  DIR_ARTICULOS, rutaDe, leerJSON, escribirJSON, asegurarDir,
  slug, haceDias, hoyISO, semanaISO, log, listarArticulos,
} from './lib/util.mjs';

const cfg = leerJSON(rutaDe('config', 'consultas.json'));
const sitio = leerJSON(rutaDe('config', 'sitio.json'));
const maximo = Number(process.env.MAXIMO_SEMANAL || sitio.maximoPorSemana || 5);
const ventana = Number(process.env.VENTANA_DIAS || cfg.ventanaDias || 10);

log.titulo(`Busqueda semanal — ventana de ${ventana} dias, hasta ${maximo} articulos`);

asegurarDir(DIR_ARTICULOS);
const yaPublicados = new Set(listarArticulos().map((a) => a.pmid));
const desde = haceDias(ventana);
const hasta = hoyISO();

const candidatos = new Map();

for (const consulta of cfg.consultas) {
  log.info(`Consulta: ${consulta.etiqueta}`);
  let pmids = [];
  try {
    pmids = await pubmed.buscar(consulta.termino, { desde, hasta, maximo: 40 });
  } catch (e) {
    log.error(`Fallo la consulta "${consulta.id}": ${e.message}`);
    continue;
  }
  const nuevos = pmids.filter((id) => !yaPublicados.has(id));
  log.info(`${pmids.length} resultados, ${nuevos.length} nuevos`);
  for (const pmid of nuevos) {
    const previo = candidatos.get(pmid);
    if (previo) { previo.temas.push(consulta.etiqueta); previo.peso += consulta.peso / 2; }
    else candidatos.set(pmid, { pmid, temas: [consulta.etiqueta], peso: consulta.peso });
  }
}

if (!candidatos.size) {
  log.aviso('No hay articulos nuevos esta semana. Nada que publicar.');
  process.exit(0);
}

const ids = [...candidatos.keys()];
log.info(`Recuperando metadatos de ${ids.length} candidatos`);

const metadatos = [];
for (let i = 0; i < ids.length; i += 100) metadatos.push(...await pubmed.resumenes(ids.slice(i, i + 100)));

const textos = {};
for (let i = 0; i < ids.length; i += 50) Object.assign(textos, await pubmed.abstracts(ids.slice(i, i + 50)));

const f = cfg.filtros;
const evaluados = metadatos.map((m) => {
  const extra = textos[m.pmid] ?? {};
  const c = candidatos.get(m.pmid);
  let puntaje = c.peso;

  if (f.revistasDestacadas.some((r) => m.revista.toLowerCase().includes(r.toLowerCase()))) puntaje += 8;
  if (m.tipos.some((t) => ['Systematic Review', 'Meta-Analysis'].includes(t))) puntaje += 6;
  if (m.tipos.includes('Randomized Controlled Trial')) puntaje += 5;
  if (m.tipos.includes('Review')) puntaje += 2;
  if (c.temas.length > 1) puntaje += 3;
  const palabras = (extra.resumen ?? '').split(/\s+/).filter(Boolean).length;
  if (palabras >= (f.minimoPalabrasResumen ?? 120)) puntaje += 4;

  return { ...m, ...extra, temas: c.temas, puntaje, palabrasResumen: palabras };
})
  .filter((a) => !a.tipos.some((t) => f.excluirTipos.includes(t)))
  .filter((a) => !f.requiereResumen || a.palabrasResumen >= (f.minimoPalabrasResumen ?? 120))
  .sort((a, b) => b.puntaje - a.puntaje);

log.info(`${evaluados.length} candidatos pasan los filtros`);

const seleccion = evaluados.slice(0, maximo);
const semana = semanaISO();
let guardados = 0;

for (const a of seleccion) {
  const identificador = `${hoyISO()}-${slug(a.titulo) || a.pmid}`;
  const archivo = path.join(DIR_ARTICULOS, `${identificador}.json`);
  if (fs.existsSync(archivo)) continue;

  escribirJSON(archivo, {
    id: identificador,
    estado: 'pendiente',           // pendiente → resumido → ilustrado → publicado
    pmid: a.pmid,
    doi: a.doi,
    titulo: a.titulo,
    tituloEs: null,                // lo redacta el paso 2
    revista: a.revista,
    autores: a.autores,
    fechaPublicacion: a.fecha,
    tiposPublicacion: a.tipos,
    enlace: a.enlace,
    resumenOriginal: a.resumen,
    mesh: a.mesh ?? [],
    palabrasClave: a.palabrasClave ?? [],
    temas: a.temas,
    puntaje: Number(a.puntaje.toFixed(1)),
    semana,
    descubiertoEl: hoyISO(),
    publicadoEl: hoyISO(),
    tips: null,
    sintesis: null,
    aplicacionDocente: null,
    infografia: null,
  });
  guardados++;
  log.ok(`${a.puntaje.toFixed(1)} pts — ${a.titulo.slice(0, 78)}`);
}

log.titulo(`Guardados ${guardados} articulos nuevos (semana ${semana})`);
