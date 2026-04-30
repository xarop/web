---
image: assets/images/screenshot-landing.webp
title: xarop.com landing
date: 2026-04-30
year: 2026
role: Disseny & Desenvolupament
description: Landing page d'alta performance per a xarop.com. Astro 5, TypeScript, CSS pur, multilingüe, 7 paletes, ~10 KB de JS.
url: https://xarop.com
categories: [Design, FrontEnd, Portfolio]
tags: [a11y, Astro, cloudflare, css, design, javascript, performance, TypeScript, xarop]
---

<!-- aside -->
<a href="https://xarop.com"><img src="{{root}}assets/images/screenshot-landing.webp" alt="xarop.com — landing page" loading="lazy"></a>

<!-- main -->
## El projecte

**landing** page de [xarop.com](https://xarop.com): una pàgina d'entrada d'alt rendiment construïda amb Astro 5 i TypeScript. Presenta el portfolio, els serveis i FAQs en tres idiomes (CA / ES / EN), amb paletes de color intercanviables i suport de tema fosc/clar.

## Stack

- **Astro 5** — generació estàtica, routing i components
- **TypeScript** — tota la lògica de components i configuració tipada
- **Vanilla CSS** — design tokens, 7 *flavor palettes*, mode fosc, sense frameworks externs
- **Asap** — tipografia auto-allotjada, zero crides a Google Fonts
- **Cloudflare Pages** — deploy i CDN global

## Característiques

- **~10 KB de JavaScript** — tot progressiu, la pàgina funciona sense JS
- **7 sabors** de paleta persistits a `localStorage`
- **Multilingüe** (CA / ES / EN) via routing natiu d'Astro
- **Scroll reveal** amb `IntersectionObserver`, sense dependències
- **Accessible** — WCAG 2.1, focus rings, `prefers-reduced-motion`
- **Deploy** compatible amb Cloudflare Pages, Vercel i Netlify

[xarop.com →](https://xarop.com) · [Codi a GitHub](https://github.com/xarop/landing)
