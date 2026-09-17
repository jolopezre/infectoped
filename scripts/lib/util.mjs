// Utilidades compartidas por todos los scripts del proyecto.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const rutaDe = (...p) => path.join(RAIZ, ...p);

export const DIR_ARTICULOS = rutaDe('contenido', 'articulos');
export const DIR_SITIO = rutaDe('sitio');
export const DIR_PUBLICO = rutaDe('publico');
export const DIR_PLANTILLAS = rutaDe('plantillas');

export function asegurarDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function leerJSON(ruta, porDefecto = null) {
  try { return JSON.parse(fs.readFileSync(ruta, 'utf8')); }
  catch { return porDefecto; }
}

export function escribirJSON(ruta, datos) {
  asegurarDir(path.dirname(ruta));
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n', 'utf8');
}

export function listarArticulos() {
  if (!fs.existsSync(DIR_ARTICULOS)) return [];
  return fs.readdirSync(DIR_ARTICULOS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => leerJSON(path.join(DIR_ARTICULOS, f)))
    .filter(Boolean)
    .sort((a, b) => String(b.publicadoEl).localeCompare(String(a.publicadoEl)));
}

const ACENTOS = { á:'a', é:'e', í:'i', ó:'o', ú:'u', ü:'u', ñ:'n', Á:'a', É:'e', Í:'i', Ó:'o', Ú:'u', Ñ:'n' };

export function slug(texto = '') {
  return String(texto)
    .replace(/[áéíóúüñÁÉÍÓÚÑ]/g, (c) => ACENTOS[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function escapar(texto = '') {
  return String(texto)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export function fechaLarga(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

export function hoyISO() { return new Date().toISOString().slice(0, 10); }

export function haceDias(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function semanaISO(fecha = new Date()) {
  const d = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const inicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d - inicio) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(semana).padStart(2, '0')}`;
}

export function esperar(ms) { return new Promise((r) => setTimeout(r, ms)); }

export const log = {
  info: (...m) => console.log('  ·', ...m),
  ok: (...m) => console.log('  ✓', ...m),
  aviso: (...m) => console.warn('  !', ...m),
  error: (...m) => console.error('  ✗', ...m),
  titulo: (m) => console.log(`\n▌ ${m}`),
};
