---
image: assets/images/screenshot-xarop-com.webp
title: Nova versió de xarop.com (2026)
date: 2026-04-23
description: He reescrit xarop.com des de zero. Sense WordPress, sense base de dades, sense JS al client. Només HTML, CSS modern i Markdown.
url: https://web.xarop.com
categories: [Blog]
tags: [a11y, Català, css, Git, github-pages, html, javascript, meta, Node.js, WordPress, xarop, xarop.com]
flavor: maduixa
---

Aquest lloc és la versió 2026 de xarop.com. És, bàsicament, **menys**: menys codi, menys dependències, menys abstraccions.

## Què tenia abans

Una instal·lació de WordPress. Tema personalitzat. Base de dades MySQL. Cache. Plugins de seguretat. Backups. Un VPS. Un monitor de *uptime*. Un any sense escriure cap article perquè actualitzar el blog implicava obrir el panell d'administració i lluitar contra l'editor Gutenberg.

## Què té ara

Una carpeta amb fitxers Markdown. Un script de build de Node.js. Tres fitxers CSS. GitHub Pages. Zero base de dades.

Per escriure un article:

```bash
$ touch content/blog/nou-post.md
$ $EDITOR content/blog/nou-post.md
$ git push
```

GitHub Actions construeix el lloc i el publica. Trenta segons després, és a internet.

## Per què

Perquè WordPress era *overkill* per un blog personal amb vuit articles l'any. Perquè mantenir un servidor és feina que no m'aporta res. Perquè la web torna a ser millor quan és petita, plana i semàntica.

També: perquè m'agradava la idea que el meu lloc tingués **sabors**. "xarop" vol dir *xarop* en català — dolç i concentrat — i els sabors eren una broma visual que em feia il·lusió implementar. Ara pots canviar la paleta sencera amb un clic. Cap recàrrega. És gairebé tot CSS. En total hi ha set sabors: maduixa, nabiu, gerd, menta, llimona, taronja i regalèssia.

## Stack

- **HTML** escrit a mà, semànticament el més net que he sabut.
- **CSS** modern amb *custom properties*, `@media (prefers-color-scheme)`, `::selection`, `color-scheme`, view transitions. Cap framework.
- **Markdown** per al contingut, `gray-matter` per al front-matter, `marked` per al render.
- **Asap** — tipografia per als títols, auto-allotjada (OFL), sense cap crida a Google Fonts.
- **Node.js** per al build (sense runtime al client).
- **GitHub Pages** per al hosting.

És molt probablement el stack més avorrit que he utilitzat en deu anys. Em fa molt feliç.

## Migració del contingut

L'arxiu de WordPress (2007–2024) ha migrat en format Markdown: uns 90 articles de blog i 70 projectes de portfolio, amb categories, tags i imatges destacades conservades. Cap contingut perdut, cap base de dades.

Les imatges destacades s'han descarregat del servidor antic, convertit a WebP (max 1200px, q82) i auto-allotjat. Els projectes nous sense imatge generen un screenshot automàtic de la URL del projecte via Puppeteer.

## Navegació per contingut

Blog i portfolio tenen un aside sticky amb totes les categories i tags com a núvol navegable. Les pàgines de cada categoria i tag mostren el contingut filtrat amb el mateix aside per continuar explorant.

## Què ve després

Notes tècniques sobre CSS modern, rendiment, accessibilitat, i alguna excursió ocasional a altres temes. Sense calendari, sense compromís.

Gràcies per llegir-me — si és la primera vegada que hi caus, benvingut.
