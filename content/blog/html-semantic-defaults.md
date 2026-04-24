---
title: "HTML semàntic: els *defaults* ja són bons"
date: 2026-03-28
description: Per què escriure HTML semàntic sense classes resol un 80% dels problemes de CSS abans que existeixin.
categories: [Design, FrontEnd]
tags: [html, a11y]
flavor: llimona
---

Abans d'escriure CSS, escriu HTML. Bé.

## Què vol dir "semàntic"

Usar la etiqueta que descriu el propòsit, no l'aparença:

- `<nav>` per a navegació, no `<div class="nav">`.
- `<main>` per al contingut principal.
- `<article>` per a contingut autònom (un post, una fitxa de producte).
- `<aside>` per a contingut relacionat però separable.
- `<header>` / `<footer>` per a capçaleres i peus (tant del site com d'un `<article>`).
- `<section>` per a agrupacions temàtiques amb títol.
- `<button>` per a accions, `<a>` per a navegació. **Mai al revés.**

## Beneficis immediats

**Accessibilitat gratuïta.** Els lectors de pantalla entenen estructura sense ARIA. Els usuaris de teclat naveguen per *landmarks*.

**SEO millor.** Els motors entenen jerarquia.

**CSS més senzill.** `article > header > h1` és un selector útil. Si tot són `<div>`, necessites classes per tot.

**Menys classes.** Pico CSS, classless, demostra que amb HTML semàntic ja tens el 80% del camí fet.

## Exemples pràctics

Una llista de posts:

```html
<ol class="post-list" reversed>
  <li>
    <article>
      <h3><a href="/post">Títol</a></h3>
      <time datetime="2026-04-23">23 abril 2026</time>
      <p>Descripció...</p>
    </article>
  </li>
</ol>
```

Una targeta de projecte:

```html
<article>
  <header>
    <h2>Nom del projecte</h2>
    <p>Front-end · 2025</p>
  </header>
  <p>Descripció del que hi vaig fer.</p>
  <footer>
    <a href="https://...">Visita</a>
  </footer>
</article>
```

Cap classe. Cada etiqueta descriu el seu propòsit.

## Regla de mà

Si t'estàs inventant una classe com `.wrapper`, `.container`, `.inner` o `.box`, pregunta't si és realment un `<div>` o si podria ser `<article>`, `<section>`, `<aside>`, `<nav>` o `<figure>`.

El 80% de les vegades, existeix una etiqueta millor.
