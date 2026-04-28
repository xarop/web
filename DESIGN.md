# xarop — Sistema de Disseny

> Menys és més. Semàntica primer. CSS després. JS només si cal.

---

## Filosofia

**xarop** vol dir *xarop* en català: dolç, concentrat, amb sabor. El disseny segueix la mateixa idea — contingut concentrat, sense ornaments inútils, amb un toc de color que el fa memorable.

Tres principis:

1. **Semàntica primer.** HTML abans que CSS. CSS abans que JS. Si una etiqueta `<article>` pot fer la feina, no cal un `<div class="article">`.
2. **Zero dependències per defecte.** Sense bases de dades, sense runtime, sense frameworks pesats. Només fitxers estàtics generats des de Markdown.
3. **Sabors, no temes.** El color és una decisió semàntica. Cada "sabor" és una paleta completa coherent.

---

## Arquitectura

```
xarop.com/
├── content/          Markdown (la font de veritat)
│   ├── pages/        Pàgines estàtiques (about, cv, contacte)
│   ├── blog/         Articles del blog
│   └── portfolio/    Projectes del portfolio
├── src/              Codi font
│   ├── css/          tokens.css · flavors.css · main.css
│   ├── js/           enhance.js (millores progressives)
│   ├── templates/    base.html (única plantilla)
│   └── assets/       Imatges, fonts, logo SVG
├── scripts/          build.js — Node.js ~250 línies
├── dist/             HTML generat (publicable, git-ignored)
└── .github/          Workflow de deploy a GitHub Pages
```

**Flux:** `content/*.md` → `scripts/build.js` → `dist/*.html`

El build script fa: llegir Markdown, aplicar front-matter, injectar a la plantilla, escriure HTML. Cap dependència de runtime al client.

---

## Sabors (paletes de color)

Cada sabor és un bloc de variables CSS sota `[data-flavor="X"]` a `flavors.css`. Canviar de sabor és canviar un atribut al `<html>`. Tot es re-calcula via cascade.

| Sabor | Color primari | Caràcter |
|-------|---------------|----------|
| `maduixa` | `#FF0000` | El clàssic. Vermell intens. Default. |
| `nabiu` | `#3B4CCA` | Blau fosc, digital, fred. |
| `gerd` | `#CF255E` | Rosa fosc, enèrgic. |
| `menta` | `#00A878` | Fresc, net, verd. |
| `llimona` | `#D4A300` | Àcid, daurat. |
| `taronja` | `#FF6B35` | Càlid, enèrgic. |
| `regalessia` | `#1A1A1A` | Seriós, quasi negre (s'inverteix en dark mode). |

Activació: `<html data-flavor="menta">`. Sense atribut → `maduixa`.

Cada sabor defineix: `--color-accent`, `--color-accent-deep`, `--color-accent-soft`. Aquestes tres variables alimenten tots els elements de color del lloc: logo, enllaços, focus rings, tags, hover states.

---

## Tipografies

Quatre famílies. Tres via *system stack* (zero latència). Una externa per als títols.

| Variable | Ús | Stack / font |
|----------|-----|-------|
| **Asap** | Tots els headings (`h1`–`h4`) | Auto-allotjada (OFL) · weights 400, 500, 700 |
| `--font-sans` | Cos, UI | `system-ui, -apple-system, "Segoe UI", Inter, sans-serif` |
| `--font-serif` | Cos alternatiu (opcional, `data-type="serif"`) | `ui-serif, Georgia, "Newsreader", serif` |
| `--font-mono` | Codi, meta, labels d'idioma | `ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace` |

**Asap** s'aplica a `h1, h2, h3, h4` via `--font-headings`. Auto-allotjada a `src/assets/fonts/` via `@font-face` a `tokens.css`. Sense cap petició externa, `font-display: swap`.

### Escala de headings

| Element | Mida | Weight | Letter-spacing |
|---------|------|--------|----------------|
| `h1` | `--text-3xl` (~51px) | 700 | `-0.02em` |
| `h2` | `--text-2xl` (~38px) | 700 | `-0.015em` |
| `h3` | `--text-xl` (~28px) | 700 | — |
| `h4` | `--text-lg` (~21px) | 500 | — |

### Escala tipogràfica completa (perfect fourth, 1.333)

```
--text-xs:   0.75rem   (12px)   — timestamps, tags
--text-sm:   0.875rem  (14px)   — meta, nav, captions
--text-base: 1rem      (16px)   — cos del text
--text-lg:   1.333rem  (~21px)  — h4, highlights
--text-xl:   1.777rem  (~28px)  — h3
--text-2xl:  2.369rem  (~38px)  — h2
--text-3xl:  3.157rem  (~51px)  — h1
```

Line-height: `1.6` per cos, `1.2` per títols.

---

## Espai

Escala basada en `rem`, múltiples de `0.25rem` (4px):

```
--space-1:  0.25rem   (4px)
--space-2:  0.5rem    (8px)
--space-3:  0.75rem   (12px)
--space-4:  1rem      (16px)
--space-5:  1.25rem   (20px)
--space-6:  1.5rem    (24px)
--space-8:  2rem      (32px)
--space-12: 3rem      (48px)
--space-16: 4rem      (64px)
--space-24: 6rem      (96px)
```

Amplada màxima del contingut: `--measure: 65ch` (òptima per lectura). En pantalles grans: `min(110ch, 100% - var(--space-12))`.

---

## Layout

- **Una columna.** Contingut centrat a `65ch`. Body és un CSS Grid de 3 columnes: `1fr [contingut] 1fr`.
- **Sense grids complexes.** Si cal una graella (portfolio), `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`.
- **Grid rows:** `auto 1fr auto` — header, main, footer. El main ocupa l'espai sobrant.
- **Home layout:** a ≥ 1024px, grid de 2 columnes `3fr 1fr` amb aside sticky.

---

## Header

El header conté tots els controls globals del lloc:

```
[ logo xarop ]  [ nav: inici · blog · portfolio · cv · contacte ]  [ ● flavor · CA lang · ☀ tema ]
```

- **Logo:** SVG inline, `fill: currentColor`, canvia amb el sabor.
- **Nav:** links amb underline de color accent a l'actiu.
- **header-end** (flex row, `margin-left: auto`):
  - **Flavor picker:** punt de color del sabor actiu; al hover s'expandeixen els set punts. El punt actiu s'amaga quan el picker és obert (via `:has()`). Requereix JS.
  - **Lang picker:** tile monospace amb l'idioma actiu; al hover s'expandeix la llista. Requereix JS.
  - **Theme toggle:** icona sol/lluna SVG. Requereix JS.

---

## Selector d'idioma

Estètica de tauler d'aeroport (split-flap). Tile monospace amb `background: var(--color-bg)`, `border: var(--border)`. Al hover s'expandeix la llista (mateix mecanisme `max-width: 0 → 300px` que el flavor picker).

- Idiomes: CA (original) · ES · EN · SV · IT
- Traducció: Google Translate via cookie `googtrans=/ca/es`.
- URL: `?lang=es` s'actualitza amb `history.replaceState`. Compartible i bookmark-able.
- CA sempre recarrega la pàgina sense cookie → contingut original garantit.
- Els codis d'idioma estan protegits de la traducció amb `translate="no"`.

---

## Accessibilitat

- Contrast mínim WCAG AA (4.5:1 text, 3:1 UI).
- Focus rings visibles: `outline: 2px solid var(--color-accent)`, `outline-offset: 3px`.
- `prefers-reduced-motion` respectat — les animacions (View Transitions, flap) s'ometen.
- `prefers-color-scheme` per mode fosc automàtic.
- Semàntica HTML5 primer. ARIA (`role`, `aria-pressed`, `aria-current`, `aria-label`) quan la semàntica nativa no és suficient.
- Navegació accessible per teclat al 100%.
- `.sr-only` per contingut only-screen-reader (text del logo, etc.).

---

## Mode fosc

Automàtic segons `prefers-color-scheme: dark`. Es pot forçar:
- `data-theme="dark"` o `data-theme="light"` al `<html>`.
- Toggle manual (sol/lluna) al header.
- URL `?theme=dark|light` per a links directes al footer.
- Persistit a `localStorage` (`xarop:theme`).

Paleta dark: fons `#111110`, text `#f0efe9`, borde `#2a2a27`.

---

## JavaScript — Millores progressives

**Per defecte: cap JS.** La web funciona sense JS al 100%.

Tot el JS és a `src/js/enhance.js` (~210 línies), carregat amb `defer`. Usa el patró **progressive enhancement**: cada feature comprova si l'element existeix abans d'activar-se.

| Feature | Activació | Persistència |
|---------|-----------|-------------|
| Flavor picker | `data-enabled="true"` a `.flavor-picker` | `localStorage` (`xarop:flavor`) |
| Theme toggle | `data-enabled="true"` a `.theme-toggle` | `localStorage` (`xarop:theme`) |
| Lang picker | `data-enabled="true"` a `.lang-picker-wrap` | `localStorage` (`xarop:lang`) + `?lang=` URL |
| View Transitions | `document.startViewTransition` API | — |
| Giscus theme sync | `window.addEventListener("message")` des de `giscus.app` | — |

### Tècniques CSS per a les transicions sense JS

- **Flavor/lang expand:** `max-width: 0 → 300px` amb `transition`. Evita el problema de `display: none` no-animable.
- **Active item hidden:** `:has(button[aria-pressed="true"]) { display: none }` — CSS pur, sense JS.
- **Flap animation:** `@keyframes flap` amb `rotateX(-90deg)` i `opacity: 0`.
- **Theme icons:** `.icon-sun { display: block }` + `:root[data-theme="dark"] .icon-sun { display: none }` — sense JS per al canvi visual.

---

## Protecció de contingut de la traducció

El nom de marca "xarop" i els codis d'idioma estan protegits de Google Translate:

- `translate="no"` a `.lang-picker-wrap` i elements de nav amb codis d'idioma.
- `class="notranslate"` als mateixos elements (suport GT legacy).
- `build.js` embolcalla automàticament les ocurrències de "xarop" en text Markdown amb `<span translate="no">xarop</span>`, excloent URLs i atributs HTML.

---

## Comentaris (giscus)

Els posts del blog inclouen una secció de comentaris via [giscus](https://giscus.app), que usa GitHub Discussions com a backend. Zero cookies, zero trackers.

**Configuració** (a `scripts/build.js`):

```javascript
const GISCUS = {
  repo: "xarop/web",
  repoId: "R_kgDOSKW4Ew",
  category: "General",
  categoryId: "DIC_kwDOSKW4E84C73Kj",
};
```

**Mapping:** `pathname` — cada post mapa a una Discussion amb títol `/blog/{slug}/`.

**Tema:** el widget s'inicialitza en `light`. Quan l'usuari canvia el tema del lloc, `enhance.js` envia un `postMessage` a l'iframe de giscus per sincronitzar-lo. Quan giscus carrega (missatge `message` des de `giscus.app`), s'aplica el tema actiu del lloc.

**Secció CSS:** `.comments` — `margin-top: var(--space-12)`, `border-top: var(--border)`.

**Migració WordPress:** `scripts/import-wp-comments.js` — importa comentaris aprovats del XML d'exportació de WordPress cap a GitHub Discussions. Requereix token de GitHub amb scope `write:discussion`.

---

## Anti-patrons (què NO fem)

- Cap `<div class="wrapper container inner">`. Si cal un `<div>`, qüestiona't la vida.
- Cap framework CSS utilitari (Tailwind, etc.). Tokens propis + CSS modern natiu.
- Cap runtime JS al client per renderitzar contingut.
- Cap imatge sense `width`/`height` i `alt`.
- Cap font externa si pot anar amb *system stack* (excepció: Asap auto-allotjada per a headings `h1`–`h4`).
- Cap `!important` tret que sigui reset o override de Google Translate.
- Cap classe que descrigui aparença (`.red`, `.big`). Classes descriuen propòsit.
- Cap dependència de npm al client.
