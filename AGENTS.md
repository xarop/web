# AGENTS.md — IA en el desenvolupament de xarop.com

Aquest fitxer documenta com s'han fet servir agents d'IA (Claude Code / Anthropic) en el disseny, desenvolupament i manteniment d'aquest projecte.

---

## Eina

**[Claude Code](https://claude.ai/code)** — CLI i extensió VS Code d'Anthropic. Model: Claude Sonnet 4.6.

Totes les sessions de treball amb IA es fan des del directori arrel del repositori (`c:\_GIT\web`). L'agent té accés de lectura/escriptura als fitxers del projecte i pot executar comandes de build.

---

## Tasques delegades a l'agent

### Disseny del header (2026-04)

Redisseny complet del header en múltiples iteracions:

1. **Flavor picker** com a punt de color al header que s'expandeix al hover. Tècnica: `max-width: 0 → 300px` amb CSS transition (evita el problema de `display: none`). El punt actiu s'amaga amb `:has()` CSS pur.
2. **Theme toggle** sol/lluna SVG minimalista. Icons mostrats/ocultats via cascade CSS sense JS.
3. **Selector d'idioma** estètica split-flap d'aeroport. Mateixa tècnica d'expand que el flavor picker. Integrat amb Google Translate via cookie `googtrans`.
4. **Reordenació** del header-end: color picker → idioma → tema.
5. **Correccions**: mida del dot actiu (10px → 12px), alineació vertical dels controls, IT → ESSO (afegit `translate="no"`).

### Internacionalització (2026-04)

- Implementació del selector d'idiomes CA/ES/EN/SV/IT.
- Integració Google Translate (cookie `googtrans`, widget `element.js`).
- URL `?lang=xx` amb `history.replaceState` per a links compartibles.
- Protecció del nom de marca "xarop" a `build.js` amb regex post-processing.
- Protecció de codis d'idioma amb `translate="no"` / `class="notranslate"`.
- CA restaura el contingut original via `location.reload()` (única manera fiable).

### Millores de contingut

- Noms de sabor al home convertits en `<button>` clicables que canvien el sabor en viu.
- Mover el selector d'idioma del header al `<main>` (just abans del H1) a totes les pàgines.

---

## Decisions de disseny preses amb l'agent

| Decisió | Alternativa descartada | Motiu |
|---------|------------------------|-------|
| `max-width` transition per expand | `display: none → flex` | `display` no és animable |
| `:has()` per amagar item actiu | JS per gestionar classes | Menys JS, CSS pur suficient |
| `location.reload()` per restaurar CA | Usar widget GT sense reload | Widget GT no restaura fiablement |
| `?lang=xx` en URL | `/es/` subpaths | Site estàtic, no hi ha servidor |
| `translate="no"` en blocs | Protegir tot el `<body>` | Protecció total bloquejaría la traducció |
| regex en `build.js` per "xarop" | Wrapping manual al Markdown | Automatitzat, no requereix edició manual |

---

## Fitxers principals modificats per l'agent

| Fitxer | Canvis |
|--------|--------|
| `src/templates/base.html` | Header redesign, lang picker, flavor picker, theme toggle SVG, `translate="no"` |
| `src/css/main.css` | Flavor picker styles, lang picker styles, theme toggle, animació flap, tokens |
| `src/js/enhance.js` | Flavor picker, theme toggle, lang picker (URL, cookies, Google Translate) |
| `scripts/build.js` | Post-processing "xarop" protection |
| `content/pages/index.md` | Flavor names com a `<button>` clicables |

---

## Convencions per a futures sessions

- **Build sempre al final:** `npm run build` i verificar que acabi amb `✅ Fet!`.
- **Tokens CSS:** fer servir `var(--color-*)`, `var(--space-*)`, `var(--font-*)`. Cap valor hardcoded de color.
- **No afegir JS si CSS pot fer-ho.** Revisar si `:has()`, `max-width transition`, o `data-*` attributes resolen el problema.
- **Progressive enhancement:** cada feature JS comprova primer si l'element existeix (`if (element) { ... }`).
- **`translate="no"`** a qualsevol element que contingui codi, noms propis, o text que no s'ha de traduir.
- **Idioma de fitxers:** comentaris i documentació en català. Codi en anglès.

---

## Limitacions conegudes

- **Google Translate** no restaura el contingut original de manera fiable via widget — sempre cal `location.reload()` per a CA.
- **`?lang=xx`** no es propaga automàticament en navegar entre pàgines (la cookie ho gestiona, però l'URL perd el param). Solució futura: interceptar clicks a `<a>` internes.
- **`/es/`** com a ruta real requeriria generar totes les pàgines en cada idioma a build time — canvi arquitectural important.
- **Sabor `regalessia`** té lògica especial per a dark mode (color quasi negre → s'inverteix a blanc trencat).
