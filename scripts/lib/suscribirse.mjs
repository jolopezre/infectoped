// Página /suscribirse/: explica el RSS y facilita añadirlo a un lector.
import { escapar } from './util.mjs';

export function paginaSuscribirse({ sitio }) {
  const feed = `${sitio.url}/feed.xml`;
  const f = encodeURIComponent(feed);
  const lectores = [
    ['Feedly', `https://feedly.com/i/subscription/feed/${f}`, 'El más popular. Gratis, con app para móvil.'],
    ['Inoreader', `https://www.inoreader.com/?add_feed=${f}`, 'Muy completo, con búsqueda y reglas.'],
    ['NewsBlur', `https://newsblur.com/?url=${f}`, 'Ligero y de código abierto.'],
    ['The Old Reader', `https://theoldreader.com/feeds/subscribe?url=${f}`, 'Sencillo, sin distracciones.'],
  ];
  return `
<section class="cabecera-seccion">
  <div class="contenedor estrecho">
    <h1>Recibe cada edición</h1>
    <p>Publicamos cada cuatro días. Puedes seguir INFECTOPED desde tu lector de noticias, sin cuenta ni correo.</p>
  </div>
</section>

<section class="seccion contenedor estrecho prosa">
  <h2>Con un clic</h2>
  <p>Si ya usas alguno de estos lectores, este botón añade INFECTOPED directamente:</p>
  <div class="lectores">
    ${lectores.map(([nombre, enlace, nota]) => `<a class="lector" href="${escapar(enlace)}" target="_blank" rel="noopener">
      <strong>${escapar(nombre)}</strong>
      <span>${escapar(nota)}</span>
    </a>`).join('\n    ')}
  </div>

  <h2>O copia la dirección</h2>
  <p>Cualquier lector de RSS acepta esta dirección. Pégala donde diga «añadir fuente» o «add feed»:</p>
  <div class="caja-url">
    <code id="url-feed">${escapar(feed)}</code>
    <button class="boton boton-pequeno" id="copiar-feed" type="button">Copiar</button>
  </div>

  <h2>¿Qué es esto y por qué no es un correo?</h2>
  <p>Un lector de RSS reúne en un solo lugar todo lo que sigues —revistas, blogs, este sitio— y te avisa cuando hay algo nuevo. No pide tu correo, no manda publicidad y nadie sabe qué lees. Si no tienes uno, <a href="https://feedly.com" target="_blank" rel="noopener">Feedly</a> es el más fácil para empezar y funciona en el navegador y en el móvil.</p>
  <p>Si prefieres que las ediciones te lleguen al correo, escríbenos a <a href="mailto:${escapar(sitio.correo)}">${escapar(sitio.correo)}</a> y lo tendremos en cuenta.</p>
</section>`;
}

