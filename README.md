# xarop.com

> La web personal de xarop — front-end engineer. Versió 2026.

Sense WordPress. Sense base de dades. Sense JS obligatori. Només HTML semàntic, CSS modern i Markdown.

**Demo:** [xarop.com](https://xarop.com) · **Disseny:** [DESIGN.md](./DESIGN.md)

---

## Característiques

- **Static site** generat des de Markdown amb un script de Node (~250 línies).
- **Sis sabors** de color intercanviables (`maduixa`, `menta`, `llimona`, `móra`, `taronja`, `regalèssia`).
- **Mode clar/fosc** automàtic (`prefers-color-scheme`).
- **Zero JS obligatori**. Millores progressives opcionals.
- **Accessible** (WCAG 2.1 AA), semàntica HTML pura.
- **Deploy automàtic** a GitHub Pages via Actions.
- **RSS feed** incorporat.

---

## Estructura

```
.
├── content/              Markdown (la font de veritat)
│   ├── pages/            Pàgines (index, cv, contacte)
│   ├── blog/             Articles
│   └── portfolio/        Projectes
├── src/
│   ├── css/              tokens, flavors, main
│   ├── js/               enhance.js (opcional)
│   ├── templates/        base.html
│   └── assets/           logo, fonts, imatges
├── scripts/build.js      Build script
├── dist/                 Generat (git-ignored)
├── DESIGN.md             Sistema de disseny
└── .github/workflows/    Deploy a GH Pages
```

---

## Desenvolupament

Requereix **Node.js ≥ 18**.

```bash
# Instal·lar dependències
npm install

# Build
npm run build

# Servir localment
npm run dev
# Obre http://localhost:4000
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

### Una pàgina nova

`content/pages/pagina.md` → publicada a `/pagina/`.

---

## Sabors

Cada pàgina pot tenir el seu sabor via front-matter (`flavor: menta`). L'usuari pot canviar-lo al peu de pàgina (si el JS opcional està actiu — es persisteix a `localStorage`).

Per afegir un sabor nou: edita `src/css/flavors.css`.

---

## Desactivar JavaScript

El JS és 100% opcional. Per desactivar-lo:

- Elimina `<script src="/js/enhance.js" defer></script>` de `src/templates/base.html`.
- Re-build.

La web continua funcionant igual, excepte pel canvi de sabor en viu i la persistència.

---

## Llicència

Codi: **MIT**. Contingut: © xarop, reservats tots els drets.
