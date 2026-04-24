---
image: assets/images/screenshot-napptilius.webp
title: Napptilius
date: 2026-04-22
year: 2026
role: Front-end engineer
description: "Prova tècnica (Zara Web Challenge): catàleg de smartphones responsive, accessible i multillengua amb frontend React i backend BFF opcional."
url: https://github.com/xarop/napptilius
categories: [FrontEnd, Portfolio]
tags: [react, vite, styled-components, bff, testing, prova-tecnica]
flavor: nabiu
---

## Context

Napptilius és una **prova tècnica** feta com a resposta al *Zara Web Challenge* (veure `RETO.md` al repositori). L'objectiu és construir un catàleg de smartphones amb criteris reals de producte: rendiment, accessibilitat, UX de càrrega, mantenibilitat i qualitat de codi.

## Què hi vaig fer

- Desenvolupament d'una SPA amb llistat, detall de producte, carret i confirmació de comanda.
- Cerca en temps real (amb debouncing) i integració de filtratge via API.
- Implementació de selecció de color/emmagatzematge, productes similars i microinteraccions.
- Internacionalització en català, castellà i anglès.
- Accessibilitat: navegació amb teclat, rols ARIA i comportament responsive mobile-first.
- Tests amb Vitest + Testing Library (27 tests) i lint/format amb ESLint + Prettier.

## Arquitectura

- **Frontend**: React 19 + Vite 6 + React Router 7 + Context API amb `useReducer`.
- **Estils**: Styled Components + CSS Variables (tema clar/fosc).
- **Backend BFF opcional (Node/Express)**:
	- proxy de l'API per ocultar l'API key,
	- normalització de dades,
	- processat d'imatges (retall, resize, WebP),
	- cache LRU per millorar rendiment.

## Resultat

Projecte desplegat en dos escenaris:

- Fullstack (frontend + backend): https://napptilius.onrender.com/
- Frontend only (GitHub Pages): https://xarop.github.io/napptilius/

## Enllaç

- Repositori: https://github.com/xarop/napptilius
