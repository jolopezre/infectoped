// Cliente minimo de NCBI E-utilities (PubMed). Sin dependencias externas.
// Documentacion: https://www.ncbi.nlm.nih.gov/books/NBK25501/
import { esperar, log } from './util.mjs';

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const HERRAMIENTA = 'infectoped';
const CORREO = process.env.NCBI_EMAIL || 'contacto@infectoped.org';
const CLAVE = process.env.NCBI_API_KEY || '';
// Sin clave: maximo 3 peticiones/segundo. Con clave: 10.
const PAUSA_MS = CLAVE ? 120 : 380;

function url(endpoint, params) {
  const q = new URLSearchParams({ db: 'pubmed', tool: HERRAMIENTA, email: CORREO, ...params });
  if (CLAVE) q.set('api_key', CLAVE);
  return `${BASE}/${endpoint}.fcgi?${q}`;
}

async function pedir(endpoint, params, comoTexto = false) {
  for (let intento = 1; intento <= 4; intento++) {
    try {
      const res = await fetch(url(endpoint, params), { headers: { 'User-Agent': `${HERRAMIENTA}/1.0 (${CORREO})` } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await esperar(PAUSA_MS);
      return comoTexto ? res.text() : res.json();
    } catch (e) {
      log.aviso(`E-utilities ${endpoint} intento ${intento}: ${e.message}`);
      if (intento === 4) throw e;
      await esperar(800 * intento);
    }
  }
}

/** Busca PMIDs para un termino, restringido a una ventana de fechas. */
export async function buscar(termino, { desde, hasta, maximo = 40 } = {}) {
  const params = {
    term: termino,
    retmode: 'json',
    retmax: String(maximo),
    sort: 'date',
    datetype: 'pdat',
  };
  if (desde) params.mindate = desde.replace(/-/g, '/');
  if (hasta) params.maxdate = hasta.replace(/-/g, '/');
  const datos = await pedir('esearch', params);
  return datos?.esearchresult?.idlist ?? [];
}

/** Metadatos resumidos (titulo, revista, autores, fecha, DOI, tipos). */
export async function resumenes(pmids) {
  if (!pmids.length) return [];
  const datos = await pedir('esummary', { id: pmids.join(','), retmode: 'json' });
  const r = datos?.result ?? {};
  return (r.uids ?? []).map((uid) => {
    const a = r[uid] ?? {};
    const doi = (a.articleids ?? []).find((x) => x.idtype === 'doi')?.value ?? '';
    return {
      pmid: uid,
      titulo: (a.title ?? '').replace(/<\/?[^>]+>/g, '').replace(/\.$/, ''),
      revista: a.fulljournalname || a.source || '',
      fecha: a.pubdate || a.epubdate || '',
      autores: (a.authors ?? []).map((x) => x.name).slice(0, 12),
      tipos: a.pubtype ?? [],
      doi,
      volumen: a.volume ?? '',
      paginas: a.pages ?? '',
      enlace: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
    };
  });
}

/** Resumen (abstract) completo por PMID, en texto plano. */
export async function abstracts(pmids) {
  if (!pmids.length) return {};
  const xml = await pedir('efetch', { id: pmids.join(','), retmode: 'xml', rettype: 'abstract' }, true);
  const salida = {};
  const bloques = xml.split('<PubmedArticle>').slice(1);
  for (const b of bloques) {
    const pmid = (b.match(/<PMID[^>]*>(\d+)<\/PMID>/) || [])[1];
    if (!pmid) continue;
    const partes = [...b.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g)].map((m) => {
      const etiqueta = (m[1].match(/Label="([^"]+)"/) || [])[1];
      const texto = limpiar(m[2]);
      return etiqueta ? `${capitalizar(etiqueta)}: ${texto}` : texto;
    });
    const mesh = [...b.matchAll(/<DescriptorName[^>]*>([\s\S]*?)<\/DescriptorName>/g)].map((m) => limpiar(m[1]));
    const palabras = [...b.matchAll(/<Keyword[^>]*>([\s\S]*?)<\/Keyword>/g)].map((m) => limpiar(m[1]));
    salida[pmid] = { resumen: partes.join('\n\n').trim(), mesh: [...new Set(mesh)].slice(0, 12), palabrasClave: [...new Set(palabras)].slice(0, 12) };
  }
  return salida;
}

function limpiar(s = '') {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const capitalizar = (s) => s.charAt(0) + s.slice(1).toLowerCase();
