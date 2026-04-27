---
title: "Desenvolupament en 2026: ¿S'ha de saber escriure codi si tens IA?"
date: 2026-04-27
tags: [IA, AI, development, programming, Claude, GitHub Copilot, diccionari de llenguatges, productivitat]
categories: [Blog, Desarrollo, IA]
---

Fa quatre anys, quan GitHub Copilot va sortir en beta, la reacció de molts desenvolupadors va ser: _"Esto matarà la programació."_ Avui, després de viure 2022-2026 amb IA generativa integrada en el workflow diari, puc dir que ha passat exactament el contrari. Però la feina **ha canviat radicalment**.

## La pregunta mal formulada

Quan diem _"saber escriure codi"_, estem barrejant dues coses totalment diferents:

1. **Picar tecles** — escriure sintaxi, memoritzar métodes de las API, recordar la estructura de una classe.
2. **Resoldre problemes** — descompondre una tasca gran en petites peces, entendre les relacions entre components, detectar quan una solució no escala.

La IA és **increïblement bona** en #1. És mediocre en #2, i aquí és on importa el teu treball.

## El "diccionari" ja no importa (gairebé)

Mira aquest escenari típic de 2015:

> _"Nécessito ordenar un array de objectes per timestamp descendent. Recordo que JavaScript té un métode, però ¿qual es? ¿Es `.sort()`? ¿Necessito import algo?"_

Solució de 2015: Googlear, trobar SO, copiar-pegar código, debugar.

**Solució de 2026:** Obrir Copilot, escriure el comentari o media frase, generar la línea en 0.3 segons.

El "diccionari" de cada llenguatge — els métodes, la sintaxis, els paràmetres — **ya no es la limitante**. Pots no sabé la diferència entre `map`, `filter` i `reduce` en JavaScript, i igualment generar codi correcte. (Pitjor per a ti si no ho entens, però funciona.)

Lo preocupant és: ¿Qué pasa quan **la IA genera un bug**?


## El bug silencioso és el peor
Així és on "saber escriure codi" torna a importar. La IA pot generar codi que:

- Compila perfectament
- Passa els tests (si els tests no cobreixen el cas límit)
- Falla en producció a les 3 del matí

Exemples reals que he vist en 2026:

1. **Race condition**: Copilot genera una solució amb `async/await` que sembla correcta, però no gestiona l'ordre de promeses.
2. **Memory leak**: Un component React amb efectes secundaris que no es netejen correctament.
3. **SQL injection invisible**: Una query construïda dinàmicament que sembla segura a primera vista.

En aquests casos, si no **enténs el problema que la IA està intentant resoldre**, no veurás el bug. I que els tests siguin verts no significa que sigui correcte.

## Llavors, ¿què ha canviat realment?

### 2015 — Velocitat limitada per sintaxis

```
Problema → 20 min recherche + 10 min code → Bug hunt
```

### 2026 — Velocitat limitada per comprensió

```
Problema → 2 min prompt enginyer → 5 min review crítico → Validació → Deploy
```

**Els desenvolupadors ràpids de 2026 no són els que teclegen més ràpid.** Són els que:

1. **Veuen el problema més clar** — Saben descompondre-ho en abstraccions.
2. **Revisen el codi generat amb dubte sistemàtic** — Pregunten-se: _"¿Per qué Copilot va triar aquesta solució? ¿Quines suposicions fa?"_
3. **Refactoritzen amb coratge** — Saben que el codi generat rarament és el millor. És un **primer esbós**.
4. **Escriuen prompts millors** — No demanen "hola, fes un login", demanen "implementa un login amb JWT, gestiona expiració de token, i refresca automàticamente cada hora".

## El "diccionari" evoluciona, però les bases no

No, no necessites memoritzar tots els métodes de JavaScript o l'ordre dels paràmetres en MySQL. Pero **necessites saber:

- Els paradigmes del llenguatge (OOP, funcional, etc.)
- Les estructures de dades i per a qué serveixen
- Notacions de complexitat (O(n), O(1), etc.)
- Els patrons de disseny més comuns
- Com debugar quan la IA s'equivoca

Aquests son els **ciments**. Si los dominas, pots treballar amb qualsevol lenguaje en 2 setmanes. Si no els dominas, la IA et deixarà penjat.

## La realitat de 2026

Avui diria que "saber escriure codi" significa:

> **Entenre l'arquitectura, validar la lógica, i saber pedir ajuda a la IA de manera efectiva.**

Els developers que han prosperat en aquests 4 anys son els que:

- Canviaren el seu mental model de _"Io escric código"_ a _"Io dissenyo solucions i la IA les implementa"_
- Mantingueren les bases fuertes (algoritmes, SQL, arquitectura)
- Aprengueren a usar eines com Copilot, ChatGPT, Claude no com magònia, sino com **col·legues sèniors que cometen errors**

Els que fracassaren son els que confiaren cegament que la IA fa tot correcte. I els que pensaven que ja no necessitaven aprendre perquè _"la IA ho fa tot"_.

## Conclusió

No, un developer de 2026 ja no necessita memoritzar el diccionari de cada llenguatge.

Pero **sí necessita saber més que mai**. El coneixement s'ha desplaçat, no ha desaparegut.

Ara importa més **la lógica que la sintaxis**. La **arquitectura més que la implementación**. L'**intuïció de quan quelcom no pot ser correcte**, més que saber escriure-lo perfecte.

Els millors programadors de 2026 no son els més ràpids amb el teclat. Son els que millor entenen els problemes, els que revisen amb més cura, i els que saben quan dir-le a la IA: _"No, esto no és correcte. Intenta una altre manera."_

---

**¿I tu? ¿Cómo ha canviat el teu treball en aquests anys?** La IA no ha matat la programació. L'ha elevada.
