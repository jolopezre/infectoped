#!/usr/bin/env node
/**
 * PASO 2 — Redaccion en espanol de los "5 puntos clave" con la API de Claude.
 * Toma los articulos en estado "pendiente" y produce:
 * titulo en espanol, sintesis, 5 puntos accionables para la practica clinica,
 * aplicacion al lado de la cama, nivel de evidencia y la frase de la infografia.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pedirJSON, hayClave } from './lib/claude.mjs';
import { DIR_ARTICULOS, leerJSON, escribirJSON, log } from './lib/util.mjs';

const SISTEMA = `Eres editor científico de INFECTOPED, un sitio en español dirigido a pediatras, infectólogos pediátricos y residentes que atienden niños en Latinoamérica.

Tu tarea: convertir el resumen de un artículo científico en material de difusión breve, riguroso y clínicamente útil.

REGLAS DE LENGUAJE (irrompibles):
1. Escribe en ESPAÑOL NEUTRO LATINOAMERICANO. Usa SIEMPRE la tercera persona o el infinitivo para las recomendaciones ("conviene solicitar", "considerar el retiro precoz", "el hallazgo respalda"). PROHIBIDO el voseo peninsular: nunca uses "vosotros", "considerad", "vuestro", "tenéis", "debéis". Si necesitas dirigirte al lector, usa "usted" o una forma impersonal.
2. Escribe con TILDES Y ORTOGRAFÍA COMPLETA del español. Todas las palabras que llevan tilde deben llevarla: diagnóstico, evaluación, antibiótico, clínico, población, atención, análisis, días, número, pediátrico. Un texto sin tildes es un error.
3. Usa la terminología clínica habitual en Latinoamérica: "lactante" y no "bebé"; "hemocultivo"; "antibioticoterapia"; "unidad de cuidados intensivos pediátricos (UCIP)". La primera vez que uses una sigla, defínela.

REGLAS EDITORIALES (irrompibles):
4. NUNCA inventes datos, cifras, poblaciones, dosis ni conclusiones que no estén en el resumen entregado. Si el resumen no da una cifra, no la des. Jamás inventes una dosis.
5. Calibra el verbo al diseño del estudio: un ensayo aleatorizado "demuestra"; un estudio observacional "se asocia con"; una revisión sistemática sin metaanálisis "la evidencia disponible apunta a"; una revisión de alcance o estudio cualitativo "describe" o "sugiere".
6. Cada punto clave debe ser ACCIONABLE EN LA PRÁCTICA CLÍNICA: algo que un pediatra pueda aplicar en la próxima visita, ronda o decisión terapéutica. "La resistencia antimicrobiana es un problema creciente" no es un punto clave; "solicitar hemocultivo antes de la primera dosis cuando se sospecha bacteriemia" sí lo es.
7. Sin adjetivos publicitarios, sin emojis, sin signos de exclamación. Registro profesional.
8. Este material es de difusión educativa, no una guía de práctica clínica. No formules recomendaciones normativas ("debe administrarse") sino orientaciones ancladas en lo que el estudio muestra.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, con este esquema exacto:
{
  "tituloEs": "título en español con tildes, claro, máximo 110 caracteres, sin punto final",
  "sintesis": "2 a 3 oraciones (máximo 60 palabras) que expliquen qué se estudió, en qué población y qué se encontró",
  "disenoEstudio": "una frase corta: diseño, población y ámbito, por ejemplo 'Ensayo aleatorizado en 240 lactantes hospitalizados'",
  "nivelEvidencia": "alto | moderado | bajo | exploratorio",
  "tips": [
    {"titulo": "3 a 6 palabras", "texto": "1 a 2 oraciones accionables, máximo 40 palabras"}
  ],
  "aplicacionDocente": "un párrafo de máximo 55 palabras: cómo llevar este hallazgo a la cama del paciente o a la discusión de casos con residentes",
  "fraseInfografia": "frase de gancho para la infografía, máximo 90 caracteres, sin punto final",
  "etiquetas": ["3 a 5 etiquetas temáticas en español, en minúscula, con tildes"],
  "advertencia": "limitación metodológica principal en una oración, o null si el resumen no permite juzgarla"
}
El arreglo "tips" debe tener EXACTAMENTE 5 elementos.`;

const archivos = fs.existsSync(DIR_ARTICULOS)
  ? fs.readdirSync(DIR_ARTICULOS).filter((f) => f.endsWith('.json'))
  : [];

const pendientes = archivos
  .map((f) => ({ archivo: path.join(DIR_ARTICULOS, f), datos: leerJSON(path.join(DIR_ARTICULOS, f)) }))
  .filter(({ datos }) => datos && datos.estado === 'pendiente');

log.titulo(`Redaccion de puntos clave — ${pendientes.length} articulos pendientes`);

if (!pendientes.length) process.exit(0);

if (!hayClave()) {
  log.aviso('Sin ANTHROPIC_API_KEY: se usara un resumen extractivo de respaldo.');
}

for (const { archivo, datos } of pendientes) {
  const mensaje = [
    `Titulo original: ${datos.titulo}`,
    `Revista: ${datos.revista} (${datos.fechaPublicacion})`,
    `Tipo de publicacion: ${(datos.tiposPublicacion || []).join(', ') || 'no especificado'}`,
    `Terminos MeSH: ${(datos.mesh || []).join('; ') || 'no disponibles'}`,
    '',
    'Resumen original:',
    datos.resumenOriginal,
  ].join('\n');

  try {
    const salida = hayClave()
      ? await pedirJSON({ sistema: SISTEMA, mensaje })
      : respaldoExtractivo(datos);

    const tips = (salida.tips || []).slice(0, 5);
    if (tips.length !== 5) throw new Error(`se esperaban 5 puntos, llegaron ${tips.length}`);

    escribirJSON(archivo, {
      ...datos,
      estado: 'resumido',
      tituloEs: salida.tituloEs || datos.titulo,
      sintesis: salida.sintesis || '',
      disenoEstudio: salida.disenoEstudio || '',
      nivelEvidencia: salida.nivelEvidencia || 'exploratorio',
      tips,
      aplicacionDocente: salida.aplicacionDocente || '',
      fraseInfografia: salida.fraseInfografia || (salida.tituloEs || datos.titulo).slice(0, 90),
      etiquetas: salida.etiquetas || datos.temas || [],
      advertencia: salida.advertencia ?? null,
      generadoPor: hayClave() ? (process.env.MODELO_IA || 'claude-sonnet-4-5') : 'respaldo-extractivo',
    });
    log.ok(salida.tituloEs || datos.titulo);
  } catch (e) {
    log.error(`${datos.pmid}: ${e.message}`);
  }
}

/** Respaldo sin IA: reparte las oraciones del resumen en 5 puntos. */
function respaldoExtractivo(datos) {
  const oraciones = String(datos.resumenOriginal || '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length > 6);
  const paso = Math.max(1, Math.floor(oraciones.length / 5));
  const tips = Array.from({ length: 5 }, (_, i) => ({
    titulo: `Punto clave ${i + 1}`,
    texto: oraciones[i * paso] || oraciones[oraciones.length - 1] || 'Consulte el resumen original.',
  }));
  return {
    tituloEs: datos.titulo,
    sintesis: oraciones.slice(0, 2).join(' '),
    disenoEstudio: (datos.tiposPublicacion || []).join(', '),
    nivelEvidencia: 'exploratorio',
    tips,
    aplicacionDocente: 'Resumen automatico sin revision editorial. Revise el articulo original antes de aplicarlo en la practica.',
    fraseInfografia: datos.titulo.slice(0, 90),
    etiquetas: datos.temas || [],
    advertencia: 'Resumen generado sin revision editorial.',
  };
}
