# xarop.com

> La web personal de xarop — front-end engineer. Versió 2026.

Sense WordPress. Sense base de dades. Sense JS obligatori. Només HTML semàntic, CSS modern i Markdown.

**Demo:** [xarop.com](https://xarop.com) · **Disseny:** [DESIGN.md](./DESIGN.md) · **Agents:** [AGENTS.md](./AGENTS.md)

---

## Característiques

- **Static site** generat des de Markdown amb un script de Node (~320 línies).
- **Set sabors** de color intercanviables (`maduixa`, `nabiu`, `gerd`, `menta`, `llimona`, `taronja`, `regalessia`).
- **Mode clar/fosc** automàtic (`prefers-color-scheme`) amb toggle manual sol/lluna al header.
- **Multilingüe estàtic** (CA / EN / ES / SV / IT): pàgines generades a `/en/`, `/es/`, `/sv/`, `/it/` amb `hreflang` i sitemap complet.
- **Comentaris** via [giscus](https://giscus.app) (GitHub Discussions) als posts del blog, sincronitzats amb el tema clar/fosc.
- **Zero JS obligatori**. Millores progressives opcionals via `enhance.js`.
- **Accessible** (WCAG 2.1 AA), semàntica HTML pura.
- **Deploy automàtic** a GitHub Pages via Actions.
- **RSS feed** incorporat.

---

## Estructura

```
.
├── content/              Markdown (la font de veritat)
│   ├── pages/            Pàgines (index, cv, contacte)
│   ├── cv/               CVs per perfil (cv-frontend-react.md, cv-design-engineer.md…)
│   ├── blog/             Articles
│   └── portfolio/        Projectes
├── src/
│   ├── css/              tokens.css · flavors.css · main.css
│   ├── js/               enhance.js (opcional)
│   ├── templates/        base.html
│   └── assets/           logo, fonts, imatges
├── scripts/
│   ├── build.js          Build script (genera CA + EN/ES/SV/IT)
│   ├── i18n.js           Idiomes i etiquetes de navegació
│   ├── translate.js      Motor de traducció (Claude/DeepL/Google/MyMemory/Libre)
│   └── import-wp-comments.js  Migració de comentaris WordPress → giscus
├── translations/         Caché de traduccions (git-ignored)
│   ├── en/               {slug}.json per cada peça traduïda
│   ├── es/
│   ├── sv/
│   └── it/
├── dist/                 Generat (git-ignored)
├── DESIGN.md             Sistema de disseny
├── AGENTS.md             Ús d'agents IA en el projecte
└── .github/workflows/    Deploy a GH Pages
```

---

## Desenvolupament

Requereix **Node.js ≥ 18**.

```bash
npm install      # instal·lar dependències
npm run build    # generar dist/
npm run dev      # servir a http://localhost:4000
```

---

## Escriure contingut

### Un article nou

Crea `content/blog/el-meu-post.md`:

```markdown
---
title: El meu post
date: 2026-04-23
description: Una descripció breu.
tags: [css, web]
flavor: menta
---

Contingut en **Markdown**.
```

Guarda, `git push`. GitHub Actions el publica automàticament.

### Un projecte nou

`content/portfolio/projecte.md`:

```markdown
---
title: Nom del projecte
year: 2026
role: Front-end
description: Descripció breu.
url: https://exemple.com
---

Detalls en Markdown...
```

Qualsevol projecte amb `image:` **i** `url:` al frontmatter mostra automàticament el screenshot a l'aside lateral. No cal cap marcador addicional.

Si es vol un aside completament personalitzat (contingut diferent de la captura), s'usen els marcadors `<!-- aside -->` i `<!-- main -->` al cos del Markdown:

```markdown
---
...
---

<!-- aside -->
Contingut personalitzat de l'aside (HTML o Markdown).

<!-- main -->
## El contingut principal
```

### Generar imatge automàtica des d'una URL

Qualsevol fitxer de `blog/` o `portfolio/` que tingui `url:` al frontmatter però **no** `image:` serà processat per l'script de screenshots:

```bash
npm run screenshots
```

L'script:
1. Detecta tots els `.md` amb `url:` i sense `image:`.
2. Obre cada URL amb Puppeteer (headless Chrome), fa scroll complet per activar lazy load, i converteix a WebP (1200px ample, q85).
3. Desa la imatge a `src/assets/images/screenshot-{slug}.webp`.
4. Afegeix automàticament `image: assets/images/screenshot-{slug}.webp` al frontmatter del fitxer.

Per **forçar** un nou screenshot d'un fitxer que ja té `image:`: elimina la línia `image:` del frontmatter i torna a executar `npm run screenshots`.

### Una variant de CV

`content/cv/cv-nom.md` amb frontmatter mínim:

```markdown
---
title: Rol — especialitat
slug: nom-del-rol
description: Descripció breu per a la llista.
role: Rol
---

Contingut en **Markdown**.
```

Publicat automàticament a `/cv/nom-del-rol/`. La pàgina comparteix el aside de la secció CV (foto + contacte).

### Una pàgina nova

`content/pages/pagina.md` → publicada a `/pagina/`.

---

## Multilingüe

El build genera cinc versions estàtiques del lloc: **CA** (arrel), **EN** (`/en/`), **ES** (`/es/`), **SV** (`/sv/`), **IT** (`/it/`).

### Configuració (`.env`)

```dotenv
# Motor de traducció
TRANSLATE_ENGINE=deepl   # claude | deepl | google | mymemory | libre

# Claus d'API (la del engine triat)
ANTHROPIC_API_KEY=...
DEEPL_API_KEY=...

# Scope: quants articles/projectes recents traduir
TRANSLATE_BLOG_LIMIT=10  # "all" per traduir-ho tot
TRANSLATE_PORTFOLIO_LIMIT=10
```

| Engine | Qualitat | Límit gratis | Clau necessària |
|--------|----------|-------------|-----------------|
| `claude` | Molt alta, entén Markdown | ~quota Anthropic | `ANTHROPIC_API_KEY` |
| `deepl` | Excel·lent | 500k cars/mes | `DEEPL_API_KEY` |
| `google` | Bona | Gratis (pot bloquejar IPs) | Cap |
| `mymemory` | Acceptable | 5k–50k cars/dia | Opcional (`MYMEMORY_EMAIL`) |
| `libre` | Variable | Depèn instància | `LIBRE_URL` + `LIBRE_API_KEY` |

### Caché

Les traduccions es desen a `translations/{lang}/{tipus}-{slug}.json`. En el pròxim build es reutilitzen directament (sense trucades a l'API). Per forçar una re-traducció: esborra el fitxer de caché o posa `TRANSLATE_FORCE=1`.

### Abast

- **Pàgines, CV i índexos** → sempre traduïts (tots els idiomes).
- **Blog i portfolio** → els `N` més recents (`TRANSLATE_BLOG_LIMIT` / `TRANSLATE_PORTFOLIO_LIMIT`). Els articles antics queden en català i s'indexen al sitemap sense hreflang d'altres idiomes.
- **La paraula "xarop"** mai es tradueix (protecció de marca).

### Sitemap i SEO

`dist/sitemap.xml` inclou `<xhtml:link rel="alternate" hreflang="…">` per a cada URL traduïda. Les pàgines no traduïdes apareixen al sitemap en CA sense alternates. `robots.txt` apunta al sitemap.

---

## Sabors

Set sabors disponibles, cadascun amb la seva paleta CSS completa:

| Sabor | Color | Caràcter |
|-------|-------|----------|
| `maduixa` | `#FF0000` | El clàssic. Vermell intens. |
| `nabiu` | `#3B4CCA` | Blau fosc, digital. |
| `gerd` | `#CF255E` | Rosa fosc, femení. |
| `menta` | `#00A878` | Fresc, net, verd. |
| `llimona` | `#D4A300` | Àcid, daurat. |
| `taronja` | `#FF6B35` | Càlid, enèrgic. |
| `regalessia` | `#1A1A1A` | Seriós, quasi negre. |

Cada pàgina pot tenir el seu sabor via front-matter (`flavor: menta`). L'usuari pot canviar-lo al picker del header (requereix JS). Per afegir un sabor nou: edita `src/css/flavors.css`.

---

## JavaScript opcional

El JS és **100% opcional**. Elimina la línia `<script src="/js/enhance.js" defer>` de `src/templates/base.html` i re-build — la web continua funcionant.

Quan el JS és actiu, `enhance.js` afegeix:

- **Flavor picker** al header (punt que s'expandeix al hover)
- **Theme toggle** sol/lluna al header
- **Links de tema** al footer (`?theme=dark|light`)
- **Selector d'idioma** que s'expandeix al hover (CA/ES/EN/SV/IT → pàgines estàtiques)
- **Noms de sabor clicables** a la pàgina d'inici
- **View Transitions** entre pàgines (si el navegador les suporta)
- **Sincronització de tema amb giscus** (comentaris clar/fosc en temps real)

---

## Llicència

Codi: **MIT**. Contingut: © xarop, reservats tots els drets.
