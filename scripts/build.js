#!/usr/bin/env node
/**
 * xarop.com — Build script
 * Markdown → HTML estàtic. Zero dependències de runtime.
 *
 * Ús:
 *   node scripts/build.js
 *
 * Requereix Node >= 18. Usa `marked` i `gray-matter` (dev deps).
 */

import { readFile, writeFile, mkdir, readdir, copyFile, cp } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname, basename, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";
import { LANGS, I18N } from "./i18n.js";
import { translateAll } from "./translate.js";

// Carrega .env si existeix (sense dependències externes)
const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");
const CONTENT = join(ROOT, "content");
const DIST = join(ROOT, "dist");

const SITE = {
  title: "xarop",
  description: "Front-end engineer. Blog, portfolio i xarop.",
  defaultFlavor: "maduixa",
  baseUrl: "/",
  siteUrl: "https://web.xarop.com",
  githubRepo: "https://github.com/xarop/web",
};

// Comentaris via giscus (https://giscus.app)
// Omple repoId i categoryId: ves a https://giscus.app amb el repo "xarop/web"
const GISCUS = {
  repo: "xarop/web",
  repoId: "R_kgDOSKW4Ew",
  category: "General",
  categoryId: "DIC_kwDOSKW4E84C73Kj",
};

const EDIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

const HAMBURGER_ICON = `<svg class="icon-hamburger" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/></svg><svg class="icon-close" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>`;
const CLOSE_ICON = `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>`;

// Utilitat: genera aside responsive amb toggle hamburger
function responsiveAside(asideHtml) {
  return `
<input type="checkbox" id="aside-toggle-cb" class="aside-toggle-cb">
<label for="aside-toggle-cb" class="aside-toggle" aria-label="Info">${HAMBURGER_ICON}</label>
<aside class="sidebar" id="page-aside"><label for="aside-toggle-cb" class="aside-close" aria-label="Tanca">${CLOSE_ICON}</label>${asideHtml}</aside>
`;
}

function giscusWidget() {
  if (!GISCUS.repoId || !GISCUS.categoryId) return "";
  return `
<section class="comments" aria-label="Comentaris" translate="no">
  <script src="https://giscus.app/client.js"
    data-repo="${GISCUS.repo}"
    data-repo-id="${GISCUS.repoId}"
    data-category="${GISCUS.category}"
    data-category-id="${GISCUS.categoryId}"
    data-mapping="pathname"
    data-strict="0"
    data-reactions-enabled="1"
    data-emit-metadata="0"
    data-input-position="bottom"
    data-theme="light"
    data-lang="ca"
    crossorigin="anonymous"
    async><\/script>
</section>`;
}

// ---------- Helpers ----------

marked.setOptions({ gfm: true, breaks: false, smartypants: true });

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function readTemplate() {
  return await readFile(join(SRC, "templates", "base.html"), "utf8");
}

function render(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] ?? "");
}

function addExternalLinkAttrs(html) {
  return html.replace(/<a\s+([^>]*?)href="(https?:\/\/[^"#]+(?:#[^"]*)?)"([^>]*)>/gi, (full, before, href, after) => {
    const attrs = `${before}${after}`;
    if (/\btarget\s*=\s*"_blank"/i.test(attrs)) return full;

    let relValue = "noopener noreferrer";
    const relMatch = attrs.match(/\brel\s*=\s*"([^"]*)"/i);
    if (relMatch) {
      const parts = relMatch[1].split(/\s+/).filter(Boolean);
      const merged = Array.from(new Set([...parts, "noopener", "noreferrer"]));
      relValue = merged.join(" ");
    }

    const cleanedAttrs = attrs.replace(/\s+rel\s*=\s*"[^"]*"/i, "").trim();
    const spacer = cleanedAttrs ? ` ${cleanedAttrs}` : "";
    return `<a${spacer} href="${href}" target="_blank" rel="${relValue}">`;
  });
}

function slugify(s) {
  return s.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim().replace(/[\s_]+/g, "-");
}

function formatDate(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

// Convert links relatius dins el markdown a absoluts de site
function htmlFromMarkdown(md) {
  const html = marked.parse(md);
  // Protect brand name from Google Translate (skip occurrences inside HTML tags/attrs)
  return html.replace(/(?<![a-zA-Z0-9\/\-_=".])xarop(?![a-zA-Z0-9\/\-_.])/g,
    '<span translate="no">xarop</span>');
}

// ---------- Read content ----------

async function readMarkdownDir(dir) {
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  const items = [];
  for (const f of files) {
    if (extname(f) !== ".md") continue;
    const raw = await readFile(join(dir, f), "utf8");
    const { data, content } = matter(raw);
    const slug = data.slug || slugify(basename(f, ".md"));
    items.push({
      slug,
      meta: data,
      body: content,
      filename: f,
    });
  }
  // Ordena per data descendent si hi ha
  items.sort((a, b) => new Date(b.meta.date || 0) - new Date(a.meta.date || 0));
  return items;
}

// ---------- Write page ----------

async function writePage(outPath, opts, template) {
  await ensureDir(dirname(outPath));
  const lang = opts.lang || "ca";
  const i18n = I18N[lang] || I18N["ca"];
  const pageDir = dirname(outPath);

  // root: sempre apunta a DIST (per assets: CSS, imatges)
  const relToDist = relative(pageDir, DIST).replace(/\\/g, "/");
  const root = relToDist === "" ? "./" : `${relToDist}/`;

  // langRoot: apunta al directori de l'idioma (per nav)
  const langDistDir = lang === "ca" ? DIST : join(DIST, lang);
  const relToLangDist = relative(pageDir, langDistDir).replace(/\\/g, "/");
  const langRoot = relToLangDist === "" ? "./" : `${relToLangDist}/`;

  // Ruta relativa al langDistDir (per lang switcher)
  const currentRelPath = relative(langDistDir, pageDir).replace(/\\/g, "/");

  // hreflang per al <head>
  const cleanPath = (p) => p.replace(/\/{2,}/g, "/");
  const hreflangLines = LANGS.map(l => {
    const suffix = currentRelPath ? `/${currentRelPath}/` : "/";
    const path = l === "ca" ? suffix : `/${l}${suffix}`;
    return `  <link rel="alternate" hreflang="${l}" href="${SITE.siteUrl}${cleanPath(path)}">`;
  });
  const defaultPath = cleanPath(currentRelPath ? `/${currentRelPath}/` : "/");
  hreflangLines.push(`  <link rel="alternate" hreflang="x-default" href="${SITE.siteUrl}${defaultPath}">`);
  const hreflang = hreflangLines.join("\n");

  // Lang picker: links a cada versió d'idioma
  const langPicker = LANGS.map(l => {
    const lDir = l === "ca" ? DIST : join(DIST, l);
    const targetDir = join(lDir, currentRelPath);
    const rel = relative(pageDir, targetDir).replace(/\\/g, "/");
    const href = rel === "" ? "./" : `${rel}/`;
    const isCurrent = l === lang;
    return `<li><a class="lang-btn notranslate" href="${href}" hreflang="${l}"${isCurrent ? ' aria-current="page"' : ""}>${l.toUpperCase()}</a></li>`;
  }).join("\n        ");

  const content = (opts.content || "").replaceAll("{{root}}", root);
  const nav = {
    navHome: opts.section === "home" ? 'aria-current="page"' : "",
    navBlog: opts.section === "blog" ? 'aria-current="page"' : "",
    navPortfolio: opts.section === "portfolio" ? 'aria-current="page"' : "",
    navCv: opts.section === "cv" ? 'aria-current="page"' : "",
    navContact: opts.section === "contacte" ? 'aria-current="page"' : "",
  };
  const html = render(template, {
    title: opts.title,
    description: opts.description || SITE.description,
    flavor: opts.flavor || SITE.defaultFlavor,
    ogType: opts.ogType || "website",
    ogLocale: i18n.ogLocale,
    lang: i18n.htmlLang,
    langRoot,
    langCode: lang.toUpperCase(),
    langPicker,
    hreflang,
    nav_home: i18n.home,
    nav_blog: i18n.blog,
    nav_portfolio: i18n.portfolio,
    nav_cv: i18n.cv,
    nav_contact: i18n.contact,
    content,
    root,
    ...nav,
  });
  const htmlWithExternalTargets = addExternalLinkAttrs(html);
  await writeFile(outPath, htmlWithExternalTargets, "utf8");
  console.log("  →", outPath.slice(DIST.length + 1) || "index.html");
}

// ---------- Build pages ----------

function renderTaxonomyLinks(items, basePath, prefix = "", cssClass = "tag") {
  return (items || []).map(t =>
    `<a class="${cssClass}" href="${basePath}${slugify(t)}/">${prefix}${t}</a>`
  ).join(" ");
}

async function buildTaxonomies(items, distSubdir, section, template, allCats = [], allTags = [], ctx = {}) {
  const { lang = "ca", langDist = DIST } = ctx;
  const tagMap = new Map();
  const catMap = new Map();

  for (const item of items) {
    for (const t of item.meta.tags || []) {
      const s = slugify(t);
      if (!tagMap.has(s)) tagMap.set(s, { name: t, items: [] });
      tagMap.get(s).items.push(item);
    }
    for (const c of item.meta.categories || []) {
      const s = slugify(c);
      if (!catMap.has(s)) catMap.set(s, { name: c, items: [] });
      catMap.get(s).items.push(item);
    }
  }

  const itemLi = (p) => `
    <li>
      <a href="../../${p.slug}/">
        ${p.meta.image ? `<img class="post-thumb" src="{{root}}${p.meta.image}" alt="${p.meta.title}" loading="lazy">` : ""}
        <div class="post-body">
          <h3>${p.meta.title}</h3>
          ${p.meta.date ? `<time datetime="${formatDate(p.meta.date)}">${formatDate(p.meta.date)}</time>` : ""}
          ${p.meta.description ? `<p>${p.meta.description}</p>` : ""}
        </div>
      </a>
    </li>`;

  const makeSidebar = (currentCatSlug = null, currentTagSlug = null) => {
    const catCloud = allCats.map(c => {
      const s = slugify(c);
      const active = s === currentCatSlug ? ' aria-current="page"' : "";
      return `<a class="category"${active} href="../../categories/${s}/">${c}</a>`;
    }).join(" ");
    const tagCloud = allTags.map(t => {
      const s = slugify(t);
      const active = s === currentTagSlug ? ' aria-current="page"' : "";
      return `<a class="tag"${active} href="../../tags/${s}/">#${t}</a>`;
    }).join(" ");
    return (catCloud || tagCloud) ? `
<aside class="sidebar">
  ${catCloud ? `<section><h2>Categories</h2><div class="taxonomy-cloud">${catCloud}</div></section>` : ""}
  ${tagCloud ? `<section><h2>Tags</h2><div class="taxonomy-cloud">${tagCloud}</div></section>` : ""}
</aside>` : "";
  };

  console.log(`   🏷️  Tags: ${tagMap.size} · Categories: ${catMap.size}`);

  for (const [slug, { name, items: tagged }] of tagMap) {
    await writePage(join(langDist, distSubdir, "tags", slug, "index.html"), {
      title: `#${name}`,
      section,
      lang,
      description: `${tagged.length} entrades etiquetades amb #${name}.`,
      content: `
<div class="sidebar-layout">
<div>
  <header>
    <p class="meta"><a href="../../">← ${section}</a></p>
    <h1><span class="tag" style="font-size:inherit">#${name}</span></h1>
    <p class="meta">${tagged.length} entrades</p>
  </header>
  <ol class="post-list" reversed>${tagged.map(itemLi).join("")}</ol>
</div>
${makeSidebar(null, slug)}
</div>`,
    }, template);
  }

  for (const [slug, { name, items: categorized }] of catMap) {
    await writePage(join(langDist, distSubdir, "categories", slug, "index.html"), {
      title: name,
      section,
      lang,
      description: `${categorized.length} entrades a la categoria ${name}.`,
      content: `
<div class="sidebar-layout">
<div>
  <header>
    <p class="meta"><a href="../../">← ${section}</a></p>
    <h1><span class="category" style="font-size:inherit">${name}</span></h1>
    <p class="meta">${categorized.length} entrades</p>
  </header>
  <ol class="post-list" reversed>${categorized.map(itemLi).join("")}</ol>
</div>
${makeSidebar(slug, null)}
</div>`,
    }, template);
  }
}

async function buildBlog(template, ctx = {}) {
  const { lang = "ca", langDist = DIST, posts: preloaded } = ctx;
  const posts = preloaded || await readMarkdownDir(join(CONTENT, "blog"));
  console.log(`\n📝 Blog [${lang}]: ${posts.length} posts`);

  // Índex
  const list = posts.map(p => `
    <li>
      <a href="./${p.slug}/">
        ${p.meta.image ? `<img class="post-thumb" src="{{root}}${p.meta.image}" alt="${p.meta.title}" loading="lazy">` : ""}
        <div class="post-body">
          <h3>${p.meta.title}</h3>
          <time datetime="${formatDate(p.meta.date)}">${formatDate(p.meta.date)}</time>
          ${p.meta.description ? `<p>${p.meta.description}</p>` : ""}
        </div>
      </a>
    </li>`).join("");

  const allCats = [...new Set(posts.flatMap(p => p.meta.categories || []))].sort();
  const allTags = [...new Set(posts.flatMap(p => p.meta.tags || []))].sort();
  const catCloud = allCats.map(c => `<a class="category" href="./categories/${slugify(c)}/">${c}</a>`).join(" ");
  const tagCloud = allTags.map(t => `<a class="tag" href="./tags/${slugify(t)}/">#${t}</a>`).join(" ");
  const featured = posts.filter(p => p.meta.featured).slice(0, 5);
  const recentItems = (featured.length ? featured : posts.slice(0, 5)).map(p => `
    <li><a href="./${p.slug}/"><div class="post-body"><h3>${p.meta.title}</h3><time>${formatDate(p.meta.date)}</time></div></a></li>`).join("");

  const blogSidebar = `
<aside class="sidebar">
  ${catCloud ? `<section><h2>Categories</h2><div class="taxonomy-cloud">${catCloud}</div></section>` : ""}
  ${tagCloud ? `<section><h2>Tags</h2><div class="taxonomy-cloud">${tagCloud}</div></section>` : ""}
  <section>
    <h2>Recents</h2>
    <ol class="post-list">${recentItems}</ol>
  </section>
</aside>`;

  await writePage(join(langDist, "blog", "index.html"), {
    title: "Blog",
    section: "blog",
    lang,
    description: "Articles sobre front-end, CSS, web i afins.",
    content: `
<div class="sidebar-layout">
  <div>
    <header><h1>Blog</h1><p class="meta">${posts.length} articles</p></header>
    <ol class="post-list" reversed>${list}</ol>
  </div>
  ${responsiveAside(blogSidebar.replace(/<aside class=\"sidebar\">|<\/aside>/g, ""))}
</div>`,
  }, template);

  // Posts individuals
  const ASIDE_MARKER = "<!-- aside -->";
  const MAIN_MARKER = "<!-- main -->";
  for (const p of posts) {
    const tags = renderTaxonomyLinks(p.meta.tags, "../tags/", "#");
    const cats = renderTaxonomyLinks(p.meta.categories, "../categories/", "", "category");
    const hasAside = p.body.includes(ASIDE_MARKER) && p.body.includes(MAIN_MARKER);

    const articleHeader = `
  <header>
    <h1>${p.meta.title}</h1>
    <p class="meta">
      <time datetime="${formatDate(p.meta.date)}">${formatDate(p.meta.date)}</time>
      ${cats}
    </p>
    ${tags ? `<p class="meta">${tags}</p>` : ""}
    ${p.meta.image && !hasAside ? `<figure class="featured-image"><img src="{{root}}${p.meta.image}" alt="${p.meta.title}" loading="lazy"></figure>` : ""}
  </header>`;
    const articleFooter = `
  <footer class="article-footer">
    <a href="../">← tornar al blog</a>
    <a class="edit-link" href="${SITE.githubRepo}/edit/main/content/blog/${p.slug}.md" rel="noopener" title="Edita a GitHub">${EDIT_ICON} edita</a>
  </footer>
  ${giscusWidget()}`;

    let content;
    if (hasAside) {
      const asideStart = p.body.indexOf(ASIDE_MARKER) + ASIDE_MARKER.length;
      const mainStart = p.body.indexOf(MAIN_MARKER);
      const asideHtml = htmlFromMarkdown(p.body.slice(asideStart, mainStart).trim());
      const mainHtml = htmlFromMarkdown(p.body.slice(mainStart + MAIN_MARKER.length).trim());
      content = `<div class="aside-layout">` +
        `<input type="checkbox" id="aside-toggle-cb" class="aside-toggle-cb">` +
        `<label for="aside-toggle-cb" class="aside-toggle" aria-label="Info">${HAMBURGER_ICON}</label>` +
        `<article>${articleHeader}${mainHtml}${articleFooter}</article>` +
        `<aside class="sidebar" id="page-aside"><label for="aside-toggle-cb" class="aside-close" aria-label="Tanca">${CLOSE_ICON}</label>${asideHtml}</aside>` +
        `</div>`;
    } else {
      const body = htmlFromMarkdown(p.body);
      content = `<article>${articleHeader}${body}${articleFooter}</article>`;
    }

    await writePage(join(langDist, "blog", p.slug, "index.html"), {
      title: p.meta.title,
      section: "blog",
      lang,
      description: p.meta.description || "",
      flavor: p.meta.flavor || SITE.defaultFlavor,
      ogType: "article",
      content,
    }, template);
  }

  await buildTaxonomies(posts, "blog", "blog", template, allCats, allTags, { lang, langDist });

  return posts;
}

async function buildPortfolio(template, ctx = {}) {
  const { lang = "ca", langDist = DIST, projects: preloaded } = ctx;
  const projects = preloaded || await readMarkdownDir(join(CONTENT, "portfolio"));
  console.log(`\n💼 Portfolio [${lang}]: ${projects.length} projectes`);

  const grid = projects.map(p => {
    const year = p.meta.year || (p.meta.date ? formatDate(p.meta.date).slice(0, 4) : "");
    return `
    <li>
      <a href="./${p.slug}/">
        ${p.meta.image ? `<img class="project-thumb" src="{{root}}${p.meta.image}" alt="${p.meta.title}" loading="lazy">` : ""}
        <h3>${p.meta.title}</h3>
        <p class="meta">${[p.meta.role, year].filter(Boolean).join(" · ")}</p>
        ${p.meta.description ? `<p>${p.meta.description}</p>` : ""}
      </a>
    </li>`;
  }).join("");

  const allCats = [...new Set(projects.flatMap(p => p.meta.categories || []))].sort();
  const allTags = [...new Set(projects.flatMap(p => p.meta.tags || []))].sort();
  const catCloud = allCats.map(c => `<a class="category" href="./categories/${slugify(c)}/">${c}</a>`).join(" ");
  const tagCloud = allTags.map(t => `<a class="tag" href="./tags/${slugify(t)}/">#${t}</a>`).join(" ");

  const portfolioSidebar = `
<aside class="sidebar">
  ${catCloud ? `<section><h2>Categories</h2><div class="taxonomy-cloud">${catCloud}</div></section>` : ""}
  ${tagCloud ? `<section><h2>Tags</h2><div class="taxonomy-cloud">${tagCloud}</div></section>` : ""}
</aside>`;

  await writePage(join(langDist, "portfolio", "index.html"), {
    title: "Portfolio",
    section: "portfolio",
    lang,
    description: "Projectes seleccionats.",
    content: `
<div class="sidebar-layout">
  <div>
    <header><h1>Portfolio</h1><p class="meta">${projects.length} projectes seleccionats</p></header>
    <ul class="project-list">${grid}</ul>
  </div>
  ${responsiveAside(portfolioSidebar.replace(/<aside class=\"sidebar\">|<\/aside>/g, ""))}
</div>`,
  }, template);

  const ASIDE_MARKER = "<!-- aside -->";
  const MAIN_MARKER = "<!-- main -->";
  for (const p of projects) {
    const tags = renderTaxonomyLinks(p.meta.tags, "../tags/", "#");
    const cats = renderTaxonomyLinks(p.meta.categories, "../categories/", "", "category");
    const year = p.meta.year || (p.meta.date ? formatDate(p.meta.date).slice(0, 4) : "");
    const dateFull = p.meta.date ? formatDate(p.meta.date) : "";
    const hasAside = p.body.includes(ASIDE_MARKER) && p.body.includes(MAIN_MARKER);
    const hasAutoAside = !hasAside && !!(p.meta.image && p.meta.url);

    const articleHeader = `
  <header>
    <h1>${p.meta.title}</h1>
    <p class="meta">
      ${[p.meta.role, year].filter(Boolean).join(" · ")}
      ${p.meta.url ? ` · <a href="${p.meta.url}" rel="noopener">visita →</a>` : ""}
    </p>
    ${cats ? `<p class="meta">${cats}</p>` : ""}
    ${tags ? `<p class="meta">${tags}</p>` : ""}
    ${p.meta.image && !hasAside && !hasAutoAside ? `<figure class="featured-image"><img src="{{root}}${p.meta.image}" alt="${p.meta.title}" loading="lazy"></figure>` : ""}
    ${dateFull ? `<p class="meta"><time datetime="${dateFull}">${dateFull}</time></p>` : ""}
  </header>`;
    const articleFooter = `
  <footer class="article-footer">
    <a href="../">← tornar al portfolio</a>
    <a class="edit-link" href="${SITE.githubRepo}/edit/main/content/portfolio/${p.slug}.md" rel="noopener" title="Edita a GitHub">${EDIT_ICON} edita</a>
  </footer>`;

    const makeAsideLayout = (articleHtml, asideInnerHtml) =>
      `<div class="aside-layout">` +
      `<input type="checkbox" id="aside-toggle-cb" class="aside-toggle-cb">` +
      `<label for="aside-toggle-cb" class="aside-toggle" aria-label="Info">${HAMBURGER_ICON}</label>` +
      `${articleHtml}` +
      `<aside class="sidebar" id="page-aside"><label for="aside-toggle-cb" class="aside-close" aria-label="Tanca">${CLOSE_ICON}</label>${asideInnerHtml}</aside>` +
      `</div>`;

    let content;
    if (hasAside) {
      const asideStart = p.body.indexOf(ASIDE_MARKER) + ASIDE_MARKER.length;
      const mainStart = p.body.indexOf(MAIN_MARKER);
      const asideHtml = htmlFromMarkdown(p.body.slice(asideStart, mainStart).trim());
      const mainHtml = htmlFromMarkdown(p.body.slice(mainStart + MAIN_MARKER.length).trim());
      content = makeAsideLayout(`<article>${articleHeader}${mainHtml}${articleFooter}</article>`, asideHtml);
    } else if (hasAutoAside) {
      const body = htmlFromMarkdown(p.body);
      const autoAsideHtml = `<a href="${p.meta.url}" rel="noopener"><img src="{{root}}${p.meta.image}" alt="${p.meta.title}" loading="lazy"></a>`;
      content = makeAsideLayout(`<article>${articleHeader}${body}${articleFooter}</article>`, autoAsideHtml);
    } else {
      const body = htmlFromMarkdown(p.body);
      content = `<article>${articleHeader}${body}${articleFooter}</article>`;
    }

    await writePage(join(langDist, "portfolio", p.slug, "index.html"), {
      title: p.meta.title,
      section: "portfolio",
      lang,
      description: p.meta.description || "",
      flavor: p.meta.flavor || SITE.defaultFlavor,
      ogType: "article",
      content,
    }, template);
  }

  await buildTaxonomies(projects, "portfolio", "portfolio", template, allCats, allTags, { lang, langDist });

  return projects;
}

const CV_ASIDE_MD = `<img src="{{root}}assets/images/ajl.jpg" alt="Adrià Julià Lundgren" class="avatar" loading="lazy">

**Barcelona / remot**

- [ajl@xarop.com](mailto:ajl@xarop.com)
- [linkedin.com/in/xarop](https://linkedin.com/in/xarop/)
- [github.com/xarop](https://github.com/xarop)
- [+34 620 58 26 26](https://wa.me/34620582626)`;

async function buildCv(template, ctx = {}) {
  const { lang = "ca", langDist = DIST, cvItems: preloaded } = ctx;
  const allFiles = preloaded || await readMarkdownDir(join(CONTENT, "cv"));
  const cvItems = preloaded ? allFiles : allFiles.filter(p => p.filename.startsWith("cv-"));
  console.log(`\n📋 CV [${lang}]: ${cvItems.length} variants`);

  const asideHtml = htmlFromMarkdown(CV_ASIDE_MD);

  for (const p of cvItems) {
    const slug = p.meta.slug || p.slug;
    const body = htmlFromMarkdown(p.body);
    const content =
      `<div class="aside-layout">` +
      `<input type="checkbox" id="aside-toggle-cb" class="aside-toggle-cb">` +
      `<label for="aside-toggle-cb" class="aside-toggle" aria-label="Info">${HAMBURGER_ICON}</label>` +
      `<article class="cv-page">${body}<footer class="article-footer"><a href="../">← CV</a></footer></article>` +
      `<aside class="sidebar" id="page-aside"><label for="aside-toggle-cb" class="aside-close" aria-label="Tanca">${CLOSE_ICON}</label>${asideHtml}</aside>` +
      `</div>`;
    await writePage(join(langDist, "cv", slug, "index.html"), {
      title: p.meta.title || slug,
      section: "cv",
      lang,
      description: p.meta.description || "",
      content,
    }, template);
  }

  return cvItems;
}

async function buildPages(template, posts = [], projects = [], ctx = {}) {
  const { lang = "ca", langDist = DIST, pages: preloaded } = ctx;
  const pages = preloaded || await readMarkdownDir(join(CONTENT, "pages"));
  console.log(`\n📄 Pàgines [${lang}]: ${pages.length}`);

  for (const p of pages) {
    let body = htmlFromMarkdown(p.body);
    const isHome = p.slug === "index" || p.slug === "home";
    const outPath = isHome
      ? join(langDist, "index.html")
      : join(langDist, p.slug, "index.html");

    if (isHome) {
      const recentPosts = posts.slice(0, 3).map(post => `
        <li>
          <a href="./blog/${post.slug}/">
            <h3>${post.meta.title}</h3>
            <time datetime="${formatDate(post.meta.date)}">${formatDate(post.meta.date)}</time>
            ${post.meta.description ? `<p>${post.meta.description}</p>` : ""}
          </a>
        </li>`).join("");

      const recentProjects = projects.slice(0, 3).map(project => `
        <li>
          <a href="./portfolio/${project.slug}/">
            <h3>${project.meta.title}</h3>
            ${project.meta.role ? `<p class="meta">${project.meta.role}${project.meta.year ? ` · ${project.meta.year}` : ""}</p>` : ""}
            ${project.meta.description ? `<p>${project.meta.description}</p>` : ""}
          </a>
        </li>`).join("");

      const asideHtml = `
<section>
  <h2>Darrers articles</h2>
  <ol class="post-list" reversed>${recentPosts}</ol>
  <p><a href="./blog/">tots els articles →</a></p>
</section>

<section>
  <h2>Darrers projectes</h2>
  <ul class="project-list">${recentProjects}</ul>
  <p><a href="./portfolio/">tots els projectes →</a></p>
</section>`;

      const aside = responsiveAside(asideHtml);

      await writePage(outPath, {
        title: p.meta.title,
        section: p.meta.section || p.slug,
        lang,
        description: p.meta.description || "",
        flavor: p.meta.flavor || SITE.defaultFlavor,
        content: `<div class="home-layout"><article>${body}</article>${aside}</div>`,
      }, template);
      continue;
    }

    const ASIDE_MARKER = "<!-- aside -->";
    const MAIN_MARKER = "<!-- main -->";
    let content;
    if (p.body.includes(ASIDE_MARKER) && p.body.includes(MAIN_MARKER)) {
      const asideStart = p.body.indexOf(ASIDE_MARKER) + ASIDE_MARKER.length;
      const mainStart = p.body.indexOf(MAIN_MARKER);
      const asideMd = p.body.slice(asideStart, mainStart).trim();
      const mainMd = p.body.slice(mainStart + MAIN_MARKER.length).trim();
      const asideHtml = htmlFromMarkdown(asideMd);
      const mainHtml = htmlFromMarkdown(mainMd);
      content = `<div class="aside-layout">` +
        `<input type="checkbox" id="aside-toggle-cb" class="aside-toggle-cb">` +
        `<label for="aside-toggle-cb" class="aside-toggle" aria-label="Info">${HAMBURGER_ICON}</label>` +
        `<article>${mainHtml}</article>` +
        `<aside class="sidebar" id="page-aside"><label for="aside-toggle-cb" class="aside-close" aria-label="Tanca">${CLOSE_ICON}</label>${asideHtml}</aside>` +
        `</div>`;
    } else {
      content = `<article>${body}</article>`;
    }
    await writePage(outPath, {
      title: p.meta.title,
      section: p.meta.section || p.slug,
      lang,
      description: p.meta.description || "",
      flavor: p.meta.flavor || SITE.defaultFlavor,
      content,
    }, template);
  }
  return pages;
}

async function buildHome(template, posts, projects, ctx = {}) {
  const { lang = "ca", langDist = DIST } = ctx;
  // Si hi ha un pages/index.md no tornem a generar
  const indexPath = join(langDist, "index.html");
  if (existsSync(indexPath)) return;

  const recent = posts.slice(0, 3).map(p => `
    <li><a href="./blog/${p.slug}/"><div class="post-body"><h3>${p.meta.title}</h3><time>${formatDate(p.meta.date)}</time></div></a></li>
  `).join("");

  const featured = projects.slice(0, 3).map(p => `
    <li><a href="./portfolio/${p.slug}/"><h3>${p.meta.title}</h3>${p.meta.description ? `<p>${p.meta.description}</p>` : ""}</a></li>
  `).join("");

  const asideSections = `${posts.length ? `
<section>
  <h2>Darrers articles</h2>
  <ol class="post-list">${recent}</ol>
  <p><a href="./blog/">tots els articles →</a></p>
</section>` : ""}
${projects.length ? `
<section>
  <h2>Darrers projectes</h2>
  <ul class="project-list">${featured}</ul>
  <p><a href="./portfolio/">tots els projectes →</a></p>
</section>` : ""}`;

  await writePage(indexPath, {
    title: SITE.title,
    section: "home",
    lang,
    description: SITE.description,
    content: `
<div class="home-layout">
<article>
  <h1>hola, sóc <em>xarop</em>.</h1>
  <p>Front-end engineer. Escric codi, a vegades també paraules. Aquí trobaràs el meu <a href="./blog/">blog</a>, el meu <a href="./portfolio/">portfolio</a> i el meu <a href="./cv/">cv</a>.</p>
  <p class="meta">xarop vol dir <em>xarop</em> en català. Aquest lloc té sabors — tria'n un al peu ↓.</p>
</article>
${asideSections ? `<aside class="home-aside">${asideSections}
</aside>` : ""}
</div>`,
  }, template);
}

// ---------- RSS ----------

async function buildFeed(posts) {
  const base = SITE.siteUrl;
  const items = posts.slice(0, 20).map(p => `
    <item>
      <title>${escapeXml(p.meta.title)}</title>
      <link>${base}/blog/${p.slug}/</link>
      <guid>${base}/blog/${p.slug}/</guid>
      <pubDate>${new Date(p.meta.date || 0).toUTCString()}</pubDate>
      <description>${escapeXml(p.meta.description || "")}</description>
    </item>`).join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${SITE.title}</title>
<link>${base}/</link>
<description>${SITE.description}</description>
<language>ca</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;

  await writeFile(join(DIST, "feed.xml"), feed, "utf8");
  console.log("\n📡 feed.xml");
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, c =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );
}

// ---------- Sitemap ----------

async function buildSitemap(posts, projects, cvItems, pages) {
  const base = SITE.siteUrl;
  const now = new Date().toISOString().slice(0, 10);

  // Genera URLs per tots els idiomes d'un path donat
  const langUrl = (l, path) => l === "ca" ? `${base}${path}` : `${base}/${l}${path}`;
  const allLangUrls = (path, lastmod, priority, changefreq) => {
    const hreflangAttrs = LANGS.map(l =>
      `    <xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(langUrl(l, path))}"/>`
    ).join("\n");
    return LANGS.map(l => {
      const loc = langUrl(l, path);
      return `\n  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n${hreflangAttrs}\n  </url>`;
    }).join("");
  };

  let urls = "";

  urls += allLangUrls("/", now, "1.0", "weekly");
  urls += allLangUrls("/blog/", now, "0.8", "weekly");
  for (const p of posts)
    urls += allLangUrls(`/blog/${p.slug}/`, p.meta.date ? formatDate(p.meta.date) : now, "0.7", "monthly");

  urls += allLangUrls("/portfolio/", now, "0.8", "monthly");
  for (const p of projects)
    urls += allLangUrls(`/portfolio/${p.slug}/`, p.meta.date ? formatDate(p.meta.date) : now, "0.6", "yearly");

  for (const p of cvItems) {
    const slug = p.meta.slug || p.slug;
    urls += allLangUrls(`/cv/${slug}/`, now, "0.5", "monthly");
  }

  for (const p of pages) {
    if (p.slug === "index" || p.slug === "home") continue;
    urls += allLangUrls(`/${p.slug}/`, now, "0.6", "monthly");
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}
</urlset>`;
  await writeFile(join(DIST, "sitemap.xml"), xml, "utf8");
  console.log("\n🗺️  sitemap.xml (multilingual)");
}

// ---------- Static files ----------

async function buildStaticFiles() {
  const robots = `User-agent: *\nAllow: /\nSitemap: ${SITE.siteUrl}/sitemap.xml\n`;
  await writeFile(join(DIST, "robots.txt"), robots, "utf8");

  const humans = `/* TEAM */\nDeveloper: Adrià Julià Lundgren\nSite: ${SITE.siteUrl}\nContact: ajl@xarop.com\nLocation: Barcelona, Spain\n\n/* THANKS */\nNode.js, marked, gray-matter\n\n/* SITE */\nLanguage: Catalan / Spanish / English\nDoctype: HTML5\nIDE: Visual Studio Code\n`;
  await writeFile(join(DIST, "humans.txt"), humans, "utf8");

  console.log("\n📄 robots.txt · humans.txt");
}

// ---------- Copy assets ----------

async function copyAssets() {
  // CSS
  const cssDst = join(DIST, "css");
  await ensureDir(cssDst);
  for (const f of await readdir(join(SRC, "css"))) {
    await copyFile(join(SRC, "css", f), join(cssDst, f));
  }

  // JS
  if (existsSync(join(SRC, "js"))) {
    const jsDst = join(DIST, "js");
    await ensureDir(jsDst);
    for (const f of await readdir(join(SRC, "js"))) {
      await copyFile(join(SRC, "js", f), join(jsDst, f));
    }
  }

  // Assets (recursiu per suportar subdirectoris com fonts/)
  if (existsSync(join(SRC, "assets"))) {
    await cp(join(SRC, "assets"), join(DIST, "assets"), { recursive: true });
  }

  console.log("\n🎒 Assets copiats");
}

// ---------- Main ----------

async function main() {
  console.log("🍓 Construint web.xarop.com…");
  await ensureDir(DIST);

  const template = await readTemplate();

  // ── Català (source, sense traducció) ──
  console.log("\n🟡 [CA] Catalan");
  const posts = await buildBlog(template);
  const projects = await buildPortfolio(template);
  const cvItems = await buildCv(template);
  const pages = await buildPages(template, posts, projects);
  await buildHome(template, posts, projects);

  // ── Altres idiomes (amb cache de traduccions) ──
  const otherLangs = LANGS.filter(l => l !== "ca");
  for (const lang of otherLangs) {
    const langDist = join(DIST, lang);
    await ensureDir(langDist);
    console.log(`\n🌐 [${lang.toUpperCase()}] Traduint i construint…`);

    const [tPosts, tProjects, tCvItems, tPages] = await Promise.all([
      translateAll(lang, posts, "blog"),
      translateAll(lang, projects, "portfolio"),
      translateAll(lang, cvItems, "cv"),
      translateAll(lang, pages, "page"),
    ]);

    await buildBlog(template, { lang, langDist, posts: tPosts });
    await buildPortfolio(template, { lang, langDist, projects: tProjects });
    await buildCv(template, { lang, langDist, cvItems: tCvItems });
    await buildPages(template, tPosts, tProjects, { lang, langDist, pages: tPages });
    await buildHome(template, tPosts, tProjects, { lang, langDist });
  }

  await buildFeed(posts);
  await buildSitemap(posts, projects, cvItems, pages);
  await buildStaticFiles();
  await copyAssets();

  // .nojekyll per GitHub Pages
  await writeFile(join(DIST, ".nojekyll"), "", "utf8");

  console.log("\n✅ Fet! dist/ llest per publicar.");
}

main().catch(err => {
  console.error("❌", err);
  process.exit(1);
});
