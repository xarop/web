---
image: assets/images/screenshot-xarop-com.webp
title: xarop.com
date: 2026-04-01
year: 2026
role: Tot
description: Aquesta web. Set sabors, zero base de dades, Markdown, auto-allotjada.
url: https://web.xarop.com
categories: [Design, FrontEnd, Portfolio]
tags: [a11y, css, design, Git, github-pages, html, javascript, meta, Node.js, xarop, xarop.com]
flavor: maduixa
---

## El projecte

web.xarop.com és una web personal (blog + portfolio + CV) construïda des de zero el 2026. Funciona sense base de dades, sense runtime de servidor i sense JavaScript obligatori al client. La font de veritat és Markdown al repositori; un script de Node genera HTML estàtic.

Migració completa de l'arxiu WordPress 2007–2024: uns 90 articles i 70 projectes, categories, tags i imatges destacades conservades.

## Característiques

- **Set sabors**: maduixa, nabiu, gerd, menta, llimona, taronja, regalèssia — paletes intercanviables via `data-flavor`. Canvi instantani, només CSS.
- **Mode fosc**: automàtic per `prefers-color-scheme`, amb toggle manual persistent a `localStorage`.
- **Selector d'idioma**: CA / ES / EN / SV / IT via Google Translate, amb protecció de la marca i persistència per URL (`?lang=es`).
- **Asap auto-allotjada**: tipografia de títols sense cap crida externa. Fitxers WOFF2 propis, `@font-face` a `tokens.css`.
- **Sense JS obligatori**: la web funciona al 100% sense executar JavaScript.
- **Publicació via Git**: escriure és `touch post.md && git push`.
- **GitHub Pages**: hosting gratuït, deploy automàtic via GitHub Actions.
- **Accessible**: WCAG 2.1 AA, semàntica HTML pura, focus rings visibles, `prefers-reduced-motion`.
- **Categories i tags**: distinció visual (badge vs. text pla), pàgines d'índex per cada una amb aside navegable.
- **Imatges**: 60+ imatges migrades des de WordPress, convertides a WebP auto-allotjat. Screenshots automàtics via Puppeteer per a projectes nous.

## Stack

Node.js (build) · Markdown · CSS custom properties · Asap (OFL, auto-allotjada) · GitHub Pages

[Codi a GitHub](https://github.com/xarop/web)
