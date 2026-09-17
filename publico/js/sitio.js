// Interacciones mínimas: menú móvil, buscador y filtros del archivo.
(() => {
  const boton = document.querySelector('.menu-boton');
  const nav = document.getElementById('navegacion');
  if (boton && nav) {
    boton.addEventListener('click', () => {
      const abierto = nav.classList.toggle('abierta');
      boton.setAttribute('aria-expanded', String(abierto));
    });
  }

  const buscador = document.getElementById('buscador');
  const rejilla = document.getElementById('rejilla-articulos');
  const filtros = document.getElementById('filtros');
  const vacio = document.getElementById('sin-resultados');
  if (!rejilla) return;

  const tarjetas = [...rejilla.querySelectorAll('.tarjeta')].map((el) => ({
    el, texto: el.textContent.toLowerCase(),
  }));
  let temaActivo = '';
  let consulta = '';

  const aplicar = () => {
    let visibles = 0;
    for (const { el, texto } of tarjetas) {
      const coincideTexto = !consulta || texto.includes(consulta);
      const coincideTema = !temaActivo || texto.includes(temaActivo.toLowerCase());
      const mostrar = coincideTexto && coincideTema;
      el.hidden = !mostrar;
      if (mostrar) visibles++;
    }
    if (vacio) vacio.hidden = visibles > 0;
  };

  let temporizador;
  buscador?.addEventListener('input', (e) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { consulta = e.target.value.trim().toLowerCase(); aplicar(); }, 140);
  });

  filtros?.addEventListener('click', (e) => {
    const b = e.target.closest('.filtro');
    if (!b) return;
    filtros.querySelectorAll('.filtro').forEach((x) => x.classList.remove('activo'));
    b.classList.add('activo');
    temaActivo = b.dataset.tema || '';
    aplicar();
  });
})();

// Botón de copiar la dirección del feed (página /suscribirse/).
(() => {
  const boton = document.getElementById('copiar-feed');
  const url = document.getElementById('url-feed');
  if (!boton || !url) return;
  boton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url.textContent.trim());
      const previo = boton.textContent;
      boton.textContent = '¡Copiado!';
      setTimeout(() => { boton.textContent = previo; }, 1800);
    } catch {
      const rango = document.createRange();
      rango.selectNodeContents(url);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(rango);
    }
  });
})();
