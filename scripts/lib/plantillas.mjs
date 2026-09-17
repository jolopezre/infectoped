// Plantillas HTML del sitio. Todo se genera con plantillas literales de JS
// (sin dependencias): facil de leer, facil de editar.
import { escapar, fechaLarga } from './util.mjs';

const NAV = [
  ['/', 'Inicio'],
  ['/articulos/', 'Artículos'],
  ['/infografias/', 'Infografías'],
  ['/temas/', 'Temas'],
  ['/acerca/', 'Acerca de'],
];

export function base({ sitio, titulo, descripcion, ruta = '/', imagen, contenido, claseCuerpo = '' }) {
  const tituloCompleto = ruta === '/' ? `${sitio.nombre} — ${sitio.lema}` : `${titulo} · ${sitio.nombre}`;
  const url = `${sitio.url}${ruta}`;
  const og = imagen ? `${sitio.url}${imagen}` : `${sitio.url}/img/og-principal.png`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(tituloCompleto)}</title>
<meta name="description" content="${escapar(descripcion || sitio.descripcion)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${ruta.startsWith('/articulo/') ? 'article' : 'website'}">
<meta property="og:title" content="${escapar(tituloCompleto)}">
<meta property="og:description" content="${escapar(descripcion || sitio.descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="${escapar(sitio.nombre)}" href="/feed.xml">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/estilo.css">
${sitio.analitica ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${sitio.analitica}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${sitio.analitica}');</script>` : ''}
</head>
<body class="${claseCuerpo}">
<a class="salto" href="#principal">Saltar al contenido</a>
<header class="encabezado">
  <div class="contenedor barra">
    <a class="logo" href="/"><span class="logo-marca">INFECTO<em>PED</em></span></a>
    <button class="menu-boton" aria-expanded="false" aria-controls="navegacion" aria-label="Abrir menú">
      <span></span><span></span><span></span>
    </button>
    <nav id="navegacion" class="navegacion" aria-label="Navegación principal">
      ${NAV.map(([h, t]) => `<a href="${h}"${ruta === h ? ' aria-current="page"' : ''}>${t}</a>`).join('\n      ')}
    </nav>
  </div>
</header>
<main id="principal">
${contenido}
</main>
<footer class="pie-sitio">
  <div class="contenedor pie-rejilla">
    <div>
      <p class="pie-marca">INFECTO<em>PED</em></p>
      <p class="pie-lema">${escapar(sitio.lema)}</p>
    </div>
    <div>
      <h3>Secciones</h3>
      ${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join('\n      ')}
    </div>
    <div>
      <h3>Sigue el proyecto</h3>
      <a href="/suscribirse/">Suscribirse</a>
      <a href="mailto:${escapar(sitio.correo)}">Escríbenos</a>
      <a href="/acerca/#metodo">Cómo seleccionamos</a>
    </div>
  </div>
  <div class="contenedor pie-legal">
    <p>Contenido educativo. No sustituye el juicio clínico, las guías vigentes ni la lectura del artículo original. Ninguna ficha incluye dosis: consulte siempre la fuente primaria antes de prescribir.</p>
    <p>© ${new Date().getFullYear()} ${escapar(sitio.autor)} · Publicación automatizada cada 4 días · Fuente: PubMed / NCBI</p>
  </div>
</footer>
<script src="/js/sitio.js" defer></script>
</body>
</html>`;
}

export function tarjeta(a) {
  return `<article class="tarjeta">
  <a class="tarjeta-imagen" href="/articulo/${a.id}/">
    ${a.infografia ? `<img src="${a.infografia}" alt="Infografía: ${escapar(a.tituloEs || a.titulo)}" loading="lazy" width="1080" height="1350">` : '<div class="marcador"></div>'}
  </a>
  <div class="tarjeta-cuerpo">
    <p class="etiquetas">${(a.temas || []).slice(0, 2).map((t) => `<span class="pastilla">${escapar(t)}</span>`).join('')}
      <span class="pastilla pastilla-nivel nivel-${escapar(a.nivelEvidencia || '')}">${escapar(a.nivelEvidencia || '')}</span></p>
    <h2><a href="/articulo/${a.id}/">${escapar(a.tituloEs || a.titulo)}</a></h2>
    <p class="resumen-corto">${escapar(a.sintesis || '')}</p>
    <p class="meta">${escapar(a.revista)} · ${fechaLarga(a.publicadoEl)}</p>
  </div>
</article>`;
}

export function portada({ sitio, articulos }) {
  const [destacado, ...resto] = articulos;
  return `
<section class="heroe">
  <div class="contenedor">
    <p class="heroe-etiqueta">Publicación cada 4 días · ${articulos.length} ${articulos.length === 1 ? 'artículo' : 'artículos'} en el archivo</p>
    <h1>Evidencia en <em>infectología pediátrica</em>, lista para la ronda.</h1>
    <p class="heroe-texto">Cada cuatro días rastreamos PubMed, elegimos dos artículos que de verdad cambian cómo atendemos niños con infecciones, y publicamos una infografía y cinco puntos accionables. En español, sin relleno.</p>
    <div class="heroe-acciones">
      <a class="boton" href="/articulos/">Ver el archivo</a>
      <a class="boton boton-fantasma" href="/suscribirse/">Suscribirse</a>
    </div>
  </div>
</section>

${destacado ? `<section class="destacado">
  <div class="contenedor destacado-rejilla">
    <a class="destacado-imagen" href="/articulo/${destacado.id}/">
      ${destacado.infografia ? `<img src="${destacado.infografia}" alt="Infografía: ${escapar(destacado.tituloEs)}" width="1080" height="1350">` : ''}
    </a>
    <div class="destacado-texto">
      <p class="etiquetas"><span class="pastilla pastilla-viva">Última edición</span>${(destacado.temas || []).slice(0, 2).map((t) => `<span class="pastilla">${escapar(t)}</span>`).join('')}</p>
      <h2><a href="/articulo/${destacado.id}/">${escapar(destacado.tituloEs || destacado.titulo)}</a></h2>
      <p class="destacado-sintesis">${escapar(destacado.sintesis || '')}</p>
      <ol class="tips-vista">
        ${(destacado.tips || []).map((t) => `<li><strong>${escapar(t.titulo)}</strong></li>`).join('\n        ')}
      </ol>
      <a class="enlace-flecha" href="/articulo/${destacado.id}/">Leer los 5 puntos completos</a>
    </div>
  </div>
</section>` : '<section class="contenedor vacio"><p>Todavía no hay artículos publicados. La primera edición llega el próximo lunes.</p></section>'}

${resto.length ? `<section class="seccion contenedor">
  <div class="seccion-cabecera"><h2>Ediciones recientes</h2><a class="enlace-flecha" href="/articulos/">Todo el archivo</a></div>
  <div class="rejilla">${resto.slice(0, 6).map(tarjeta).join('\n')}</div>
</section>` : ''}

<section class="franja">
  <div class="contenedor franja-rejilla">
    <div><span class="franja-num">1</span><h3>Búsqueda</h3><p>Nueve líneas de búsqueda en PubMed, cada cuatro días, sobre antimicrobianos, resistencia, sepsis, vacunas y enfermedades tropicales en niños.</p></div>
    <div><span class="franja-num">2</span><h3>Selección</h3><p>Puntuación por diseño del estudio, revista y solapamiento temático. Solo pasan los ${sitio.maximoPorSemana} mejores de cada edición.</p></div>
    <div><span class="franja-num">3</span><h3>Traducción</h3><p>Un resumen en español y cinco puntos que un pediatra puede aplicar en la siguiente ronda.</p></div>
    <div><span class="franja-num">4</span><h3>Publicación</h3><p>Infografía descargable, ficha completa con enlace a PubMed y aviso por RSS.</p></div>
  </div>
</section>`;
}

export function paginaArticulo({ sitio, a, relacionados }) {
  const autores = (a.autores || []).join(', ');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: a.tituloEs || a.titulo,
    inLanguage: 'es',
    datePublished: a.publicadoEl,
    author: (a.autores || []).map((n) => ({ '@type': 'Person', name: n })),
    publisher: { '@type': 'Organization', name: sitio.nombre },
    image: a.infografia ? `${sitio.url}${a.infografia}` : undefined,
    isBasedOn: a.enlace,
    abstract: a.sintesis,
  };
  return `
<article class="articulo">
  <header class="articulo-cabecera">
    <div class="contenedor estrecho">
      <p class="etiquetas">${(a.temas || []).map((t) => `<a class="pastilla" href="/temas/#${encodeURIComponent(t)}">${escapar(t)}</a>`).join('')}
        <span class="pastilla pastilla-nivel nivel-${escapar(a.nivelEvidencia || '')}">Evidencia: ${escapar(a.nivelEvidencia || '')}</span></p>
      <h1>${escapar(a.tituloEs || a.titulo)}</h1>
      <p class="articulo-meta">${escapar(a.revista)} · ${escapar(a.fechaPublicacion)} · Publicado en INFECTOPED el ${fechaLarga(a.publicadoEl)}</p>
      ${a.disenoEstudio ? `<p class="diseno"><strong>Diseño:</strong> ${escapar(a.disenoEstudio)}</p>` : ''}
    </div>
  </header>

  <div class="contenedor articulo-rejilla">
    <div class="articulo-cuerpo">
      <section class="bloque">
        <h2>De qué trata</h2>
        <p class="destacar">${escapar(a.sintesis || '')}</p>
      </section>

      <section class="bloque tips">
        <h2>5 puntos para la práctica</h2>
        <ol class="lista-tips">
          ${(a.tips || []).map((t, i) => `<li>
            <span class="tip-num">${i + 1}</span>
            <div><h3>${escapar(t.titulo)}</h3><p>${escapar(t.texto)}</p></div>
          </li>`).join('\n          ')}
        </ol>
      </section>

      ${a.aplicacionDocente ? `<section class="bloque aplicacion">
        <h2>Cómo llevarlo a la cama del paciente</h2>
        <p>${escapar(a.aplicacionDocente)}</p>
      </section>` : ''}

      ${a.advertencia ? `<aside class="advertencia"><strong>Léelo con cautela:</strong> ${escapar(a.advertencia)}</aside>` : ''}

      <section class="bloque fuente">
        <h2>Fuente original</h2>
        <p class="cita">${escapar(autores)}. <em>${escapar(a.titulo)}</em>. ${escapar(a.revista)}. ${escapar(a.fechaPublicacion)}.${a.doi ? ` doi:${escapar(a.doi)}` : ''}</p>
        <p><a class="boton boton-fantasma" href="${escapar(a.enlace)}" rel="noopener" target="_blank">Abrir en PubMed (PMID ${escapar(a.pmid)})</a></p>
      </section>
    </div>

    <aside class="articulo-lateral">
      ${a.infografia ? `<figure class="infografia">
        <img src="${a.infografia}" alt="Infografía con los 5 tips de: ${escapar(a.tituloEs)}" width="1080" height="1350">
        <figcaption><a class="boton boton-pequeno" href="${a.infografia}" download>Descargar infografía</a></figcaption>
      </figure>` : ''}
      ${(a.etiquetas || []).length ? `<div class="caja-lateral"><h3>Etiquetas</h3><p class="etiquetas">${a.etiquetas.map((t) => `<span class="pastilla">${escapar(t)}</span>`).join('')}</p></div>` : ''}
      ${(a.mesh || []).length ? `<div class="caja-lateral"><h3>Términos MeSH</h3><p class="mesh">${a.mesh.map(escapar).join(' · ')}</p></div>` : ''}
    </aside>
  </div>

  ${relacionados.length ? `<section class="seccion contenedor">
    <div class="seccion-cabecera"><h2>También te puede servir</h2></div>
    <div class="rejilla">${relacionados.map(tarjeta).join('\n')}</div>
  </section>` : ''}
</article>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

export function paginaArchivo({ articulos, temas }) {
  return `
<section class="cabecera-seccion">
  <div class="contenedor estrecho">
    <h1>Archivo de artículos</h1>
    <p>${articulos.length} ${articulos.length === 1 ? 'ficha publicada' : 'fichas publicadas'}. Filtra por tema o busca por palabra clave.</p>
    <div class="controles">
      <label class="campo"><span class="visualmente-oculto">Buscar</span>
        <input type="search" id="buscador" placeholder="Buscar por título, revista o tema…" autocomplete="off">
      </label>
      <div class="filtros" id="filtros">
        <button class="filtro activo" data-tema="">Todos</button>
        ${temas.map((t) => `<button class="filtro" data-tema="${escapar(t)}">${escapar(t)}</button>`).join('\n        ')}
      </div>
    </div>
  </div>
</section>
<section class="seccion contenedor">
  <div class="rejilla" id="rejilla-articulos">${articulos.map(tarjeta).join('\n')}</div>
  <p class="sin-resultados" id="sin-resultados" hidden>No encontramos artículos con ese criterio.</p>
</section>`;
}

export function paginaInfografias({ articulos }) {
  return `
<section class="cabecera-seccion">
  <div class="contenedor estrecho">
    <h1>Galería de infografías</h1>
    <p>Descárgalas y úsalas en tus ateneos, clases o pases de visita. Cita la fuente original.</p>
  </div>
</section>
<section class="seccion contenedor">
  <div class="galeria">
    ${articulos.filter((a) => a.infografia).map((a) => `<figure class="galeria-pieza">
      <a href="/articulo/${a.id}/"><img src="${a.infografia}" alt="Infografía: ${escapar(a.tituloEs)}" loading="lazy" width="1080" height="1350"></a>
      <figcaption>
        <a href="/articulo/${a.id}/">${escapar(a.tituloEs || a.titulo)}</a>
        <a class="boton boton-pequeno" href="${a.infografia}" download>Descargar PNG</a>
      </figcaption>
    </figure>`).join('\n    ')}
  </div>
</section>`;
}

export function paginaTemas({ porTema }) {
  return `
<section class="cabecera-seccion">
  <div class="contenedor estrecho"><h1>Temas</h1><p>El archivo organizado por las líneas de búsqueda del proyecto.</p></div>
</section>
<section class="seccion contenedor">
  ${Object.entries(porTema).map(([tema, arts]) => `<div class="bloque-tema" id="${encodeURIComponent(tema)}">
    <div class="seccion-cabecera"><h2>${escapar(tema)}</h2><span class="conteo">${arts.length}</span></div>
    <ul class="lista-simple">${arts.map((a) => `<li><a href="/articulo/${a.id}/">${escapar(a.tituloEs || a.titulo)}</a><span>${escapar(a.revista)}</span></li>`).join('')}</ul>
  </div>`).join('\n  ')}
</section>`;
}

export function paginaAcerca({ sitio }) {
  return `
<section class="cabecera-seccion">
  <div class="contenedor estrecho"><h1>Acerca de INFECTOPED</h1>
  <p>Evidencia en enfermedades infecciosas pediátricas, filtrada y traducida para quienes atienden niños.</p></div>
</section>
<section class="seccion contenedor estrecho prosa">
  <h2>Por qué existe</h2>
  <p>La literatura en infectología pediátrica crece más rápido de lo que un pediatra con guardias puede leer. INFECTOPED hace el filtro: cada cuatro días selecciona dos artículos relevantes y los devuelve convertidos en algo aplicable en la siguiente ronda.</p>

  <h2 id="metodo">Cómo seleccionamos</h2>
  <ol>
    <li><strong>Búsqueda.</strong> Cada cuatro días se ejecutan nueve líneas de búsqueda en PubMed (NCBI E-utilities) con una ventana de los últimos seis días.</li>
    <li><strong>Puntuación.</strong> Los candidatos se ordenan por diseño del estudio, revista, solapamiento entre líneas temáticas y calidad del resumen disponible.</li>
    <li><strong>Redacción.</strong> Los dos artículos seleccionados se resumen en español con asistencia de un modelo de lenguaje, bajo instrucciones estrictas de no extrapolar ni inventar cifras, y de no mencionar dosis.</li>
    <li><strong>Revisión.</strong> Antes de la publicación, un editor humano contrasta cada punto clave con el resumen original.</li>
    <li><strong>Publicación.</strong> Se genera la infografía, se construye el sitio y se despliega automáticamente.</li>
  </ol>

  <h2>Qué esto no es</h2>
  <p>No es una guía de práctica clínica, un protocolo institucional ni una fuente de dosificación. Es difusión: un punto de entrada. Antes de cambiar una conducta terapéutica, lea el artículo original —el enlace a PubMed está siempre en la ficha— y contrástelo con las guías vigentes y la epidemiología local.</p>

  <h2>Sobre el contexto local</h2>
  <p>Buena parte de la evidencia publicada proviene de países de altos ingresos. La resistencia antimicrobiana, la disponibilidad de fármacos y el perfil de patógenos varían mucho entre regiones: lo que funciona en una cohorte europea puede no trasladarse a un hospital peruano. Cada ficha señala la población estudiada para que esa distancia sea visible.</p>

  <h2>Uso del material</h2>
  <p>Las infografías pueden usarse libremente con fines docentes citando la fuente original y a INFECTOPED. El texto de los artículos originales pertenece a sus autores y editoriales.</p>

  <h2>Contacto</h2>
  <p>Sugerencias, correcciones y artículos que deberíamos cubrir: <a href="mailto:${escapar(sitio.correo)}">${escapar(sitio.correo)}</a>.</p>
</section>`;
}

export function pagina404() {
  return `<section class="seccion contenedor estrecho prosa" style="text-align:center;padding-block:8rem">
  <h1>Página no encontrada</h1>
  <p>El enlace que seguiste no existe o el artículo cambió de dirección.</p>
  <p><a class="boton" href="/">Volver al inicio</a> <a class="boton boton-fantasma" href="/articulos/">Ver el archivo</a></p>
</section>`;
}

export function feed({ sitio, articulos }) {
  const items = articulos.slice(0, 30).map((a) => `  <item>
    <title>${escapar(a.tituloEs || a.titulo)}</title>
    <link>${sitio.url}/articulo/${a.id}/</link>
    <guid isPermaLink="true">${sitio.url}/articulo/${a.id}/</guid>
    <pubDate>${new Date(a.publicadoEl).toUTCString()}</pubDate>
    <description>${escapar(a.sintesis || '')}</description>
    <content:encoded><![CDATA[
      <p>${escapar(a.sintesis || '')}</p>
      <ol>${(a.tips || []).map((t) => `<li><strong>${escapar(t.titulo)}:</strong> ${escapar(t.texto)}</li>`).join('')}</ol>
      <p>Fuente: <a href="${escapar(a.enlace)}">${escapar(a.revista)}</a></p>
    ]]></content:encoded>
    ${(a.temas || []).map((t) => `<category>${escapar(t)}</category>`).join('')}
  </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapar(sitio.nombre)}</title>
  <link>${sitio.url}</link>
  <atom:link href="${sitio.url}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>${escapar(sitio.descripcion)}</description>
  <language>es</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;
}
