---
title: Somespai
date: 2026-05-07
year: 2026
role: Product Engineer / Full-Stack
description: Marketplace P2P d'espais a Barcelona i Catalunya. Trasters, estudis, jardins, sales i pàrquings. Construït amb Next.js 15 i Supabase.
url: https://app.somespai.net/
categories: [Web App, Next.js, Open Source]
tags: [nextjs, supabase, maplibre, p2p, marketplace, open source]
image: assets/images/screenshot-app-somespai-desktop.webp
---

<!-- aside -->
<a href="https://app.somespai.net/"><img src="{{root}}assets/images/screenshot-app-somespai-desktop.webp" alt="Somespai Web" loading="lazy"></a>
<a href="https://app.somespai.net/"><img src="{{root}}assets/images/screenshot-app-somespai-mobile.webp" alt="Somespai App Mòbil (Mapa i Llista)" loading="lazy" style="width: 100%; margin-top: var(--space-4); border-radius: 14px; border: var(--border);"></a>
<!-- main -->

**[Somespai](https://app.somespai.net/)** és un Marketplace P2P d'espais a Barcelona i Catalunya que connecta persones que necessiten un espai amb aquelles que en tenen un de disponible. El projecte neix amb una filosofia molt clara: minimalisme radical, geolocalització prioritària, orientació *mobile-first* i la llibertat de tancar els acords econòmics de forma externa.

La plataforma inclou tot tipus d'espais: trasters per a emmagatzematge, estudis de treball, jardins, sales d'assaig, espais polivalents per a esdeveniments, places de pàrquing, entre d'altres.

### Desenvolupament i Arquitectura

Pel que fa a l'stack tecnològic, Somespai està desenvolupat completament en **codi obert** utilitzant tecnologies modernes i eficients:

- **Next.js 15 (App Router, RSC):** Generació de rutes estàtiques (SSG) per a ciutats (millorant el SEO) i server components per a oferir un alt rendiment i càrrega ràpida.
- **Supabase:** Com a backend-as-a-service. Utilitza base de dades PostgreSQL amb l'extensió **PostGIS** per a fer consultes geolocalitzades precises (`nearby_spaces`), a més d'encarregar-se de l'autenticació (Magic Links), l'emmagatzematge de fotografies, i polítiques estrictes RLS de seguretat.
- **MapLibre GL JS:** Sistemes de mapes de codi obert per garantir una experiència fluida.
- **Internacionalització (i18n):** Interfície totalment traduïda a tres idiomes: català (predeterminat), castellà i anglès (amb component de rutes `/[locale]`).
- **Sistema de disseny natiu:** S'ha evitat l'ús de Tailwind o CSS-in-JS en favor de CSS natiu amb grups `@layer`, construït basant-se en un disseny per components propis (accessibles des de l'apartat ocult `/design-system`).

### Participa i contribueix

El projecte es troba a GitHub: [**xarop/app.somespai**](https://github.com/xarop/app.somespai/).  
Tothom és benvingut no només a provar-lo —si tens alguna saleta o traster buit que vulguis anunciar i llogar, només triguen uns dos minuts a registrar i **[publicar el teu espai](https://app.somespai.net/ca/publica)**— sinó també a contribuir al codi font.

Si ets desenvolupador/a i vols ajudar a fer créixer i millorar la plataforma, fes una ullada al document [**CONTRIBUTING.md**](https://github.com/xarop/app.somespai/blob/main/CONTRIBUTING.md) del repositori així com als `DESIGN.md` i `AGENTS.md` per entendre les convencions de l'arquitectura i el disseny i proposar els teus *Pull Requests*.
