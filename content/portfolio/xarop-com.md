---
title: xarop.com
date: 2026-04-01
year: 2026
role: Tot
description: Aquesta web. Sis sabors, zero base de dades, Markdown.
url: https://web.xarop.com
tags: [html, css, node, github-pages]
flavor: maduixa
---

## El projecte

web.xarop.com és una web personal (blog + portfolio + CV) que funciona sense base de dades, sense runtime de servidor i sense JavaScript al client (opcional). La font de veritat és Markdown al repositori; un script de Node genera HTML estàtic.

## Característiques

- **Sabors**: sis paletes de color intercanviables via `data-flavor`. Canvi instantani, només CSS.
- **Sense JS obligatori**: la web funciona al 100% sense executar JavaScript.
- **Publicació via Git**: escriure és `touch post.md && git push`.
- **GitHub Pages**: hosting gratuït, deploy automàtic via GitHub Actions.
- **Accessible**: WCAG 2.1 AA, semàntica HTML pura.

## Stack

Node.js (build) · Markdown · CSS modern · GitHub Pages

[Codi a GitHub](https://github.com/xarop/web)
