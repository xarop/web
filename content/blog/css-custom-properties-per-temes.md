---
title: Temes amb CSS custom properties — i prou
date: 2026-04-15
description: Com implementar sistemes de temes (light/dark i multi-color) amb només CSS, sense JavaScript, sense preprocessadors.
categories: [Design, FrontEnd]
tags: [Català, css, css3, design, Design Systems Architecture, design-systems, FrontEnd]
flavor: menta
---

La manera estàndard moderna de fer temes a la web és amb **CSS custom properties** (variables CSS). No cal Sass, no cal JavaScript, no cal un runtime. Això és tot el que fa xarop.com per tenir sis sabors.

## La idea bàsica

```css
:root {
  --color-accent: #ff0000;
}

:root[data-flavor="menta"] {
  --color-accent: #00a878;
}

a { color: var(--color-accent); }
```

Canviar `data-flavor` al `<html>` canvia instantàniament totes les referències. Sense recàrrega, sense re-pintar JavaScript.

## Light / Dark automàtic

```css
:root {
  --bg: white;
  --text: black;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111;
    --text: #eee;
  }
}
```

Respecta les preferències del sistema. Els usuaris ja tenen una opinió; no cal imposar-los la nostra.

## Override manual

```css
:root[data-theme="dark"] {
  --bg: #111;
  --text: #eee;
}
```

Amb `data-theme="dark"` forcem el mode. Un `<button>` de tres línies de JavaScript pot canviar l'atribut. Opcional — la web funciona sense.

## `accent-color` i `color-scheme`

Dues propietats modernes que fem servir poc:

```css
:root {
  accent-color: var(--color-accent);
  color-scheme: light dark;
}
```

`accent-color` acoloreix checkboxes, radios i alguns controls natius. `color-scheme` li diu al navegador quins colors de UI (scrollbar, form controls) ha d'usar.

## Combinar tema + sabor

```css
:root[data-theme="dark"][data-flavor="menta"] {
  --color-accent: #00a878;
  --bg: #111;
}
```

Selectors atributs es poden combinar. El cartesià pot créixer però generalment el sabor només toca `--color-accent` i variants, mentre el tema toca fons/text. Es mantenen ortogonals.

## Conclusió

Les CSS custom properties són potents. En un 90% dels casos de "sistema de temes" són tot el que necessites. JavaScript per persistència (`localStorage`) és opcional — un *progressive enhancement*.
