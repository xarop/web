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

### Comentaris via giscus (2026-04)

Integració del sistema de comentaris [giscus](https://giscus.app) als posts del blog:

1. **Configuració giscus** — constant `GISCUS` a `scripts/build.js` amb `repo`, `repoId`, `category`, `categoryId`. La funció `giscusWidget()` genera el `<script>` de giscus i retorna cadena buida si els IDs no estan configurats (zero errors en builds sense configurar).
2. **Injecció al template** — el widget s'afegeix dins `<article>` just després de `<footer class="article-footer">`, únicament als posts del blog (no al portfolio).
3. **Sincronització de tema** — `enhance.js` escolta missatges `message` de l'origen `https://giscus.app`. Quan giscus carrega envia un missatge; `enhance.js` respon amb el tema actiu del lloc via `postMessage({ giscus: { setConfig: { theme } } })`. El canvi manual de tema també notifica giscus en temps real.
4. **CSS** — secció `.comments` amb `margin-top: var(--space-12)` i `border-top: var(--border)`.
5. **Migració WordPress** — script `scripts/import-wp-comments.js` que llegeix l'XML d'exportació de WordPress, filtra comentaris aprovats (descarta pingbacks/trackbacks i esborranys), crea una GitHub Discussion per post (títol = `/blog/{slug}/`), i afegeix cada comentari amb l'autor i data originals. Gestiona threading de 1r nivell (`replyToId`), detecció de discussions ja existents per idempotència, i reintents automàtics per rate limits de l'API de GitHub.

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
| `postMessage` per sync tema giscus | Re-render amb `data-theme` nou | L'iframe ja existeix; `postMessage` és l'API oficial |
| Mapping giscus `pathname` | `og:title`, `title` | Robust a canvis de títol; 1 discussion = 1 URL |
| `giscusWidget()` retorna `""` si IDs buits | Error de build | Permet builds sense giscus configurat |

---

## Fitxers principals modificats per l'agent

| Fitxer | Canvis |
|--------|--------|
| `src/templates/base.html` | Header redesign, lang picker, flavor picker, theme toggle SVG, `translate="no"` |
| `src/css/main.css` | Flavor picker styles, lang picker styles, theme toggle, animació flap, tokens, `.comments` |
| `src/js/enhance.js` | Flavor picker, theme toggle, lang picker (URL, cookies, Google Translate), giscus theme sync |
| `scripts/build.js` | Post-processing "xarop" protection, config `GISCUS`, `giscusWidget()` |
| `scripts/import-wp-comments.js` | Nou — migració de comentaris WordPress → GitHub Discussions |
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
- **Giscus threading:** GitHub Discussions no suporta respostes a respostes (2n nivell). El script d'importació ho detecta i afegeix el comentari com a top-level en lloc de fallar.
- **Comentaris importats duplicats:** els posts de les primeres execucions del script d'importació (runs 1 i 2) van rebre els comentaris dues vegades per un bug de re-execució. Cal netejar-los manualment a GitHub Discussions.
- **`viatjar-amb-cotxe-electric`** (#42) va quedar incomplet a la migració (2/8 comentaris). Cal esborrar la discussion i re-executar el script.
