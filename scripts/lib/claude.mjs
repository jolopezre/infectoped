// Cliente minimo de la API de Claude (Mensajes) para redactar los 5 tips.
import { esperar, log } from './util.mjs';

const URL_API = 'https://api.anthropic.com/v1/messages';
const MODELO = process.env.MODELO_IA || 'claude-sonnet-4-5';

export function hayClave() { return Boolean(process.env.ANTHROPIC_API_KEY); }

export async function pedirJSON({ sistema, mensaje, maxTokens = 1600 }) {
  const clave = process.env.ANTHROPIC_API_KEY;
  if (!clave) throw new Error('Falta ANTHROPIC_API_KEY');

  for (let intento = 1; intento <= 3; intento++) {
    try {
      const res = await fetch(URL_API, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': clave,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODELO,
          max_tokens: maxTokens,
          system: sistema,
          messages: [
            { role: 'user', content: mensaje },
            { role: 'assistant', content: '{' },
          ],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
      const datos = await res.json();
      const texto = '{' + (datos.content ?? []).map((b) => b.text ?? '').join('');
      return JSON.parse(recortarJSON(texto));
    } catch (e) {
      log.aviso(`API Claude intento ${intento}: ${e.message}`);
      if (intento === 3) throw e;
      await esperar(1500 * intento);
    }
  }
}

function recortarJSON(t) {
  const i = t.indexOf('{');
  const f = t.lastIndexOf('}');
  return i >= 0 && f > i ? t.slice(i, f + 1) : t;
}
