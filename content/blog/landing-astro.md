---
title: "landing page amb Astro 5, TypeScript i zero frameworks CSS"
image: assets/images/screenshot-pott-landing.webp
date: 2026-04-30
url: https://xarop.com
tags: [Astro, TypeScript, css, design, performance, a11y, cloudflare, javascript, xarop]
categories: [FrontEnd, Design]
---

## Quin problema resolvia

Necessitava una pàgina d'entrada per a xarop.com: ràpida, accessible, multilingüe i fàcil de mantenir. La web principal (web.xarop.com) és un blog/portfolio generat amb Node.js + Markdown, però no és una landing. Necessitava alguna cosa amb més control visual i rendiment de primer nivell.

## Per què Astro

[Astro 5](https://astro.build/) compila a HTML estàtic per defecte — zero JavaScript al client si no en cales. Permet barrejar components `.astro`, TypeScript i CSS sense cap overhead de runtime. El routing és bassat en fitxers, el que fa que la internacionalització (CA / ES / EN) sigui directa.

El resultat: **~10 KB de JavaScript**, tot ell opcional i progressiu (IntersectionObserver per al scroll reveal, toggle de tema, canvi de sabor).

## Stack

- **Astro 5** — build i routing
- **TypeScript** — tota la lògica de components i configuració
- **Vanilla CSS** — design tokens, paletes de color (*flavors*), mode fosc/clar, sense cap framework
- **Asap** — tipografia auto-allotjada (OFL), sense crides externes
- **Google Analytics 4** — integrat via variable d'entorn, opcional
- **Cloudflare Pages / Vercel / Netlify** — deploy estàtic, configuració per ENV

## Característiques

- **7 sabors** de paleta persistits a `localStorage`
- **Mode fosc/clar**: automàtic per `prefers-color-scheme` + toggle manual
- **Multilingüe**: Català (per defecte), Espanyol, Anglès via routing d'Astro
- **Navegació sticky** amb hamburger mòbil, switchers d'idioma i sabor
- **Scroll reveal** sense dependències externes — `IntersectionObserver` pur
- **Accessible**: focus rings, `prefers-reduced-motion`, semàntica HTML
- **MIT** per al codi; SIL OFL per a la tipografia

## Distribució del codi

CSS 37% · TypeScript 34% · Astro 27% · PHP 1% · JS 1%

[Codi a GitHub →](https://github.com/xarop/landing)
