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
│   ├── css/          Fulls d'estil modulars
│   ├── js/           JS opcional (transicions)
│   ├── templates/    Plantilles HTML
│   └── assets/       Imatges, fonts, logo
├── scripts/          Build script (Node.js)
├── dist/             HTML generat (publicable)
└── .github/          Workflow per GitHub Pages
```

**Flux:** `content/*.md` → `scripts/build.js` → `dist/*.html`

---

## Sabors (paletes de color)

Cada sabor és una variable `data-flavor` al `<html>`. Canviar de sabor és canviar un atribut. Totes les variables CSS es re-calculen automàticament.

| Sabor | Valor | Color primari | Caràcter |
|-------|-------|---------------|----------|
| `maduixa` | Maduixa (default) | `#FF0000` | El clàssic. Intens, vermell. |
| `menta` | Menta | `#00A878` | Fresc, net, verd. |
| `llimona` | Llimona | `#F5C518` | Àcid, brillant, groc. |
| `mora` | Móra | `#5B2A86` | Profund, elegant, lila. |
| `taronja` | Taronja | `#FF6B35` | Càlid, enèrgic. |
| `regalessia` | Regalèssia | `#1A1A1A` | Seriós, negre quasi pur. |

Activació: `<html data-flavor="menta">`. Sense atribut → `maduixa`.

El color afecta: logo, enllaços, `accent-color`, selecció de text, focus rings, i decoracions. **No** afecta text principal ni fons (tret que el sabor ho requereixi explícitament).

---

## Tipografies

Tres famílies, totes amb *system stack* primer per garantir rendiment sense fonts externes.

| Variable | Ús | Stack |
|----------|-----|-------|
| `--font-sans` | Cos, UI | `system-ui, -apple-system, "Segoe UI", Inter, sans-serif` |
| `--font-serif` | Títols (opcional) | `ui-serif, Georgia, "Newsreader", serif` |
| `--font-mono` | Codi, meta | `ui-monospace, "JetBrains Mono", Menzies, monospace` |

Es pot canviar la tipografia global amb `data-type="serif"` al `<html>` — tot el cos passa a serif. Més "editorial", menys "interfície".

### Escala tipogràfica (perfect fourth, 1.333)

```
--text-xs:   0.75rem   (12px)
--text-sm:   0.875rem  (14px)
--text-base: 1rem      (16px)
--text-lg:   1.333rem  (~21px)
--text-xl:   1.777rem  (~28px)
--text-2xl:  2.369rem  (~38px)
--text-3xl:  3.157rem  (~51px)
```

Line-height: `1.6` per cos, `1.2` per títols.

---

## Espai

Escala basada en `rem`, múltiples de `0.25rem` (4px):

```
--space-1:  0.25rem
--space-2:  0.5rem
--space-3:  0.75rem
--space-4:  1rem
--space-6:  1.5rem
--space-8:  2rem
--space-12: 3rem
--space-16: 4rem
--space-24: 6rem
```

Amplada màxima del contingut: `--measure: 65ch` (òptima per lectura).

---

## Layout

- **Una columna.** Contingut centrat, `max-width: 65ch`. Pren amb calma.
- **Sense grids complexes.** Si cal una graella (portfolio), `display: grid` amb `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`.
- **Sticky header minimalista** amb logo i nav. Footer al final.
- **Sense hero.** Primer paràgraf = hero.

---

## Components (pocs)

**Només el que la web necessita.** No hi ha una biblioteca.

- `<header>` del lloc: logo + nav
- `<article>` per posts i projectes
- `<aside>` per notes al marge (opcional)
- `<footer>` del lloc: contacte + copyleft
- `.flavor-picker` (opcional, JS): canvia el `data-flavor`

Tota la resta és HTML pur amb Pico CSS classless.

---

## Accessibilitat

- Contrast mínim WCAG AA (4.5:1 text, 3:1 UI).
- Focus rings visibles i gruixats (2px, color del sabor).
- `prefers-reduced-motion` respectat sempre.
- `prefers-color-scheme` support per mode fosc automàtic.
- Semàntica HTML5 primer. ARIA només quan cal.
- Navegació accessible per teclat al 100%.

---

## Mode fosc

Automàtic segons `prefers-color-scheme: dark`. Es pot forçar amb `data-theme="dark"` o `data-theme="light"`.

- Light: fons blanc trencat, text quasi negre.
- Dark: fons quasi negre, text blanc trencat.
- Sabor es manté però s'ajusta la saturació/lluminositat.

---

## JavaScript (opcional)

**Per defecte: cap JS.** La web funciona sense JS, 100%.

Millores progressives activables al `<head>` amb `<script src="/js/enhance.js" defer>`:

- Selector de sabor (sense recàrrega)
- View Transitions API entre pàgines
- Theme toggle (dark/light manual)

Res d'això és necessari. Tot funciona sense.

---

## Publicació

- **Escriure:** crear un `.md` a `content/blog/` o `content/portfolio/`.
- **Build:** `npm run build` → genera `dist/`.
- **Publicar:** push a `main`. GitHub Actions desplega a Pages.

Front-matter mínim:

```markdown
---
title: Títol del post
date: 2026-04-23
tags: [css, html]
---

Contingut en markdown...
```

---

## Anti-patrons (què NO fem)

- Cap `<div class="wrapper container inner">`. Si cal un `<div>`, qüestiona't la vida.
- Cap framework CSS utilitari (Tailwind, etc.). Pico + tokens propis.
- Cap runtime JS al client per renderitzar contingut.
- Cap imatge sense `width`/`height` i `alt`.
- Cap font externa si pot anar amb *system stack*.
- Cap `!important` tret que sigui reset.
- Cap classe que descrigui aparença (`.red`, `.big`). Classes descriuen propòsit.
