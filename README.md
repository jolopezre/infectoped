# INFECTOPED

Sitio de difusión de evidencia en **enfermedades infecciosas pediátricas**.
Cada cuatro días busca artículos nuevos en PubMed, selecciona los **dos** más
relevantes, redacta un resumen en español con **5 puntos clave accionables**,
genera una **infografía PNG** y despliega el sitio en Netlify.
Sin base de datos, sin CMS, sin servidor.

Misma arquitectura que MEDICABILITY, con tema, cadencia y paleta propios.

---

## Cómo funciona

```
GitHub Actions (días 1, 5, 9, 13, 17, 21, 25 y 29 · 06:23 Lima)
  1. buscar.mjs      PubMed E-utilities  →  contenido/articulos/*.json   (estado: pendiente)
  2. resumir.mjs     API de Claude       →  título ES + 5 puntos clave   (estado: resumido)
  3. infografia.mjs  Playwright + HTML   →  publico/img/infografias/*.png (estado: publicado)
  4. commit + push
        ↓
Netlify detecta el commit  →  npm run construir  →  publica /sitio
```

El contenido vive en el repositorio como JSON: versionado, revisable en un Pull
Request y editable a mano antes de publicar.

### Ciclo de vida de un artículo

`pendiente` → `resumido` → `publicado`

Cada paso solo toca los artículos en el estado que le corresponde, así que
cualquier script se puede reejecutar sin duplicar trabajo.

---

## Estructura del proyecto

```
infectoped/
├── config/
│   ├── sitio.json               Nombre, lema, colores, URL, artículos por edición
│   └── consultas.json           Las 9 líneas de búsqueda de PubMed y los filtros
├── contenido/articulos/         Un JSON por artículo (esto es la base de datos)
├── plantillas/infografia.html   Plantilla visual 1080×1350 de la infografía
├── publico/                     Archivos estáticos que se copian tal cual al sitio
│   ├── css/estilo.css
│   ├── js/sitio.js
│   └── img/infografias/         PNG generados (versionados en el repo)
├── scripts/
│   ├── lib/{util,pubmed,claude,plantillas,suscribirse}.mjs
│   ├── buscar.mjs · resumir.mjs · infografia.mjs · construir.mjs · servir.mjs
├── .github/workflows/
│   ├── publicacion.yml          Cron cada 4 días
│   └── verificacion.yml         Comprueba que el sitio construye en cada PR
├── netlify.toml
└── package.json
```

---

## Puesta en marcha

### 1. Local

```bash
npm install
npx playwright install chromium
cp .env.ejemplo .env          # completa ANTHROPIC_API_KEY, ANTHROPIC_WORKSPACE_ID y NCBI_EMAIL

npm run buscar                # busca en PubMed
npm run resumir               # redacta los 5 puntos clave
npm run infografias           # genera los PNG
npm run construir             # arma el sitio en /sitio
npm run servir                # http://localhost:8080
```

O todo de una vez: `npm run edicion`.

### 2. GitHub

Crea el repositorio y sube **todo**, incluida la carpeta oculta `.github/`
(si arrastras la carpeta en el navegador, GitHub la omite: usa `git push`
o crea los archivos del flujo desde el editor web).

En **Settings → Secrets and variables → Actions**:

| Tipo     | Nombre                   | Valor                                   |
|----------|--------------------------|-----------------------------------------|
| Secret   | `ANTHROPIC_API_KEY`      | Clave de la API de Claude               |
| Secret   | `ANTHROPIC_WORKSPACE_ID` | `wrkspc_...` (claves ligadas a identidad) |
| Secret   | `NCBI_EMAIL`             | Tu correo (lo exige NCBI)               |
| Secret   | `NCBI_API_KEY`           | Opcional: sube el límite de peticiones  |
| Variable | `SITIO_URL`              | `https://infectoped.netlify.app`        |
| Variable | `MODELO_IA`              | Opcional: `claude-sonnet-4-5`           |

En **Settings → Actions → General → Workflow permissions**, activa
*Read and write permissions*.

### 3. Netlify

1. **Add new project → Import an existing project** y elige el repositorio.
2. Netlify lee `netlify.toml`: build `npm run construir`, publish `sitio`.
3. En **Site configuration → Environment variables**, añade `SITIO_URL`.

> Netlify **no** genera infografías: Playwright corre solo en GitHub Actions y
> los PNG llegan ya versionados. El despliegue tarda segundos.

---

## Cadencia cada 4 días

El cron es `23 11 */4 * *`: días 1, 5, 9, 13, 17, 21, 25 y 29 de cada mes a las
11:23 UTC (06:23 en Lima).

**Advertencia honesta:** cron no sabe contar "cada 4 días" de forma continua. El
contador se reinicia con el mes, así que entre el día 29 y el día 1 siguiente el
intervalo será de 2 o 3 días según el mes. En la práctica son 8 ediciones
mensuales con un salto algo más corto en el cambio de mes.

La ventana de búsqueda es de 6 días para cubrir con margen el intervalo; la
deduplicación por PMID impide que un artículo salga dos veces.

---

## Personalización

| Quiero cambiar…            | Edita                                       |
|----------------------------|---------------------------------------------|
| Nombre, lema, colores      | `config/sitio.json`                         |
| Qué se busca               | `config/consultas.json`                     |
| Cuántos artículos/edición  | `maximoPorSemana` en `config/sitio.json`    |
| Cadencia                   | `cron` en `.github/workflows/publicacion.yml` |
| Tono y reglas del resumen  | La constante `SISTEMA` en `scripts/resumir.mjs` |
| Diseño de la infografía    | `plantillas/infografia.html`                |
| Diseño del sitio           | `publico/css/estilo.css` y `scripts/lib/plantillas.mjs` |

---

## Advertencias clínicas

- Este sitio es **difusión educativa**, no una guía de práctica clínica ni una
  fuente de dosificación. El prompt prohíbe explícitamente mencionar dosis.
- Los resúmenes se generan con asistencia de IA bajo instrucciones estrictas de
  no extrapolar. **Revisa cada punto contra el resumen original** antes de
  difundirlo. El campo `advertencia` de cada JSON registra la limitación principal.
- Buena parte de la evidencia proviene de países de altos ingresos. El perfil de
  resistencia, la disponibilidad de fármacos y la epidemiología local cambian las
  conclusiones: cada ficha indica la población estudiada para que esa distancia
  sea visible.
- Respeta el derecho de autor: el sitio publica resúmenes propios y enlaza siempre
  al artículo original.

## Licencia

Código: MIT. Contenido editorial: © sus autores.
