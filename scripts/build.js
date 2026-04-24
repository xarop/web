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

import { readFile, writeFile, mkdir, readdir, copyFile, cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, basename, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

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
};

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
  const relToDist = relative(dirname(outPath), DIST).replace(/\\/g, "/");
  const root = relToDist === "" ? "./" : `${relToDist}/`;
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
    content: opts.content,
    root,
    ...nav,
  });
  const htmlWithExternalTargets = addExternalLinkAttrs(html);
  await writeFile(outPath, htmlWithExternalTargets, "utf8");
  console.log("  →", outPath.slice(DIST.length + 1) || "index.html");
}

// ---------- Build pages ----------

function renderTaxonomyLinks(items, basePath, prefix = "") {
  return (items || []).map(t =>
    `<a class="tag" href="${basePath}${slugify(t)}/">${prefix}${t}</a>`
  ).join(" ");
}

async function buildTaxonomies(items, distSubdir, section, template) {
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
        <h3>${p.meta.title}</h3>
        ${p.meta.date ? `<time datetime="${formatDate(p.meta.date)}">${formatDate(p.meta.date)}</time>` : ""}
        ${p.meta.description ? `<p>${p.meta.description}</p>` : ""}
      </a>
    </li>`;

  console.log(`   🏷️  Tags: ${tagMap.size} · Categories: ${catMap.size}`);

  for (const [slug, { name, items: tagged }] of tagMap) {
    await writePage(join(DIST, distSubdir, "tags", slug, "index.html"), {
      title: `#${name}`,
      section,
      description: `${tagged.length} entrades etiquetades amb #${name}.`,
      content: `
<header><h1>#${name}</h1><p class="meta">${tagged.length} entrades</p></header>
<ol class="post-list" reversed>${tagged.map(itemLi).join("")}</ol>
<p><a href="../../">← tornar</a></p>`,
    }, template);
  }

  for (const [slug, { name, items: categorized }] of catMap) {
    await writePage(join(DIST, distSubdir, "categories", slug, "index.html"), {
      title: name,
      section,
      description: `${categorized.length} entrades a la categoria ${name}.`,
      content: `
<header><h1>${name}</h1><p class="meta">${categorized.length} entrades</p></header>
<ol class="post-list" reversed>${categorized.map(itemLi).join("")}</ol>
<p><a href="../../">← tornar</a></p>`,
    }, template);
  }
}

async function buildBlog(template) {
  const posts = await readMarkdownDir(join(CONTENT, "blog"));
  console.log(`\n📝 Blog: ${posts.length} posts`);

  // Índex
  const list = posts.map(p => `
    <li>
      <a href="./${p.slug}/">
        <h3>${p.meta.title}</h3>
        <time datetime="${formatDate(p.meta.date)}">${formatDate(p.meta.date)}</time>
        ${p.meta.description ? `<p>${p.meta.description}</p>` : ""}
      </a>
    </li>`).join("");

  await writePage(join(DIST, "blog", "index.html"), {
    title: "Blog",
    section: "blog",
    description: "Articles sobre front-end, CSS, web i afins.",
    content: `
<header><h1>Blog</h1><p class="meta">${posts.length} articles</p></header>
<ol class="post-list" reversed>${list}</ol>`,
  }, template);

  // Posts individuals
  for (const p of posts) {
    const tags = renderTaxonomyLinks(p.meta.tags, "../tags/", "#");
    const cats = renderTaxonomyLinks(p.meta.categories, "../categories/");
    const body = htmlFromMarkdown(p.body);
    await writePage(join(DIST, "blog", p.slug, "index.html"), {
      title: p.meta.title,
      section: "blog",
      description: p.meta.description || "",
      flavor: p.meta.flavor || SITE.defaultFlavor,
      ogType: "article",
      content: `
<article>
  <header>
    <h1>${p.meta.title}</h1>
    <p class="meta">
      <time datetime="${formatDate(p.meta.date)}">${formatDate(p.meta.date)}</time>
      ${cats}${tags}
    </p>
  </header>
  ${body}
  <hr style="margin-top:3rem;border:0;border-top:1px solid var(--color-border)">
  <p><a href="../">← tornar al blog</a></p>
</article>`,
    }, template);
  }

  await buildTaxonomies(posts, "blog", "blog", template);

  return posts;
}

async function buildPortfolio(template) {
  const projects = await readMarkdownDir(join(CONTENT, "portfolio"));
  console.log(`\n💼 Portfolio: ${projects.length} projectes`);

  const grid = projects.map(p => {
    const year = p.meta.year || (p.meta.date ? formatDate(p.meta.date).slice(0, 4) : "");
    return `
    <li>
      <a href="./${p.slug}/">
        <h3>${p.meta.title}</h3>
        <p class="meta">${[p.meta.role, year].filter(Boolean).join(" · ")}</p>
        ${p.meta.description ? `<p>${p.meta.description}</p>` : ""}
      </a>
    </li>`;
  }).join("");

  await writePage(join(DIST, "portfolio", "index.html"), {
    title: "Portfolio",
    section: "portfolio",
    description: "Projectes seleccionats.",
    content: `
<header><h1>Portfolio</h1><p class="meta">${projects.length} projectes seleccionats</p></header>
<ul class="project-list">${grid}</ul>`,
  }, template);

  for (const p of projects) {
    const tags = renderTaxonomyLinks(p.meta.tags, "../tags/", "#");
    const cats = renderTaxonomyLinks(p.meta.categories, "../categories/");
    const year = p.meta.year || (p.meta.date ? formatDate(p.meta.date).slice(0, 4) : "");
    const dateFull = p.meta.date ? formatDate(p.meta.date) : "";
    const body = htmlFromMarkdown(p.body);
    await writePage(join(DIST, "portfolio", p.slug, "index.html"), {
      title: p.meta.title,
      section: "portfolio",
      description: p.meta.description || "",
      flavor: p.meta.flavor || SITE.defaultFlavor,
      ogType: "article",
      content: `
<article>
  <header>
    <h1>${p.meta.title}</h1>
    <p class="meta">
      ${[p.meta.role, year].filter(Boolean).join(" · ")}
      ${p.meta.url ? ` · <a href="${p.meta.url}" rel="noopener">visita →</a>` : ""}
    </p>
    ${(cats || tags) ? `<p class="meta">${cats}${tags}</p>` : ""}
    ${dateFull ? `<p class="meta"><time datetime="${dateFull}">${dateFull}</time></p>` : ""}
  </header>
  ${body}
  <hr style="margin-top:3rem;border:0;border-top:1px solid var(--color-border)">
  <p><a href="../">← tornar al portfolio</a></p>
</article>`,
    }, template);
  }

  await buildTaxonomies(projects, "portfolio", "portfolio", template);

  return projects;
}

async function buildPages(template, posts = [], projects = []) {
  const pages = await readMarkdownDir(join(CONTENT, "pages"));
  console.log(`\n📄 Pàgines: ${pages.length}`);

  for (const p of pages) {
    let body = htmlFromMarkdown(p.body);
    const isHome = p.slug === "index" || p.slug === "home";
    const outPath = isHome
      ? join(DIST, "index.html")
      : join(DIST, p.slug, "index.html");

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

      const aside = `
<aside class="home-aside">
  <section>
    <h2>Darrers articles</h2>
    <ol class="post-list" reversed>${recentPosts}</ol>
    <p><a href="./blog/">tots els articles →</a></p>
  </section>

  <section>
    <h2>Darrers projectes</h2>
    <ul class="project-list">${recentProjects}</ul>
    <p><a href="./portfolio/">tots els projectes →</a></p>
  </section>
</aside>`;

      await writePage(outPath, {
        title: p.meta.title,
        section: p.meta.section || p.slug,
        description: p.meta.description || "",
        flavor: p.meta.flavor || SITE.defaultFlavor,
        content: `<div class="home-layout"><article>${body}</article>${aside}</div>`,
      }, template);
      continue;
    }

    await writePage(outPath, {
      title: p.meta.title,
      section: p.meta.section || p.slug,
      description: p.meta.description || "",
      flavor: p.meta.flavor || SITE.defaultFlavor,
      content: `<article>${body}</article>`,
    }, template);
  }
}

async function buildHome(template, posts, projects) {
  // Si hi ha un pages/index.md no tornem a generar
  const indexPath = join(DIST, "index.html");
  if (existsSync(indexPath)) return;

  const recent = posts.slice(0, 3).map(p => `
    <li><a href="./blog/${p.slug}/"><h3>${p.meta.title}</h3><time>${formatDate(p.meta.date)}</time></a></li>
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
  const items = posts.slice(0, 20).map(p => `
    <item>
      <title>${escapeXml(p.meta.title)}</title>
      <link>${SITE.baseUrl}blog/${p.slug}/</link>
      <guid>${SITE.baseUrl}blog/${p.slug}/</guid>
      <pubDate>${new Date(p.meta.date || 0).toUTCString()}</pubDate>
      <description>${escapeXml(p.meta.description || "")}</description>
    </item>`).join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${SITE.title}</title>
<link>${SITE.baseUrl}</link>
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
  console.log("🍓 Construint xarop.com…");

  // Ensure dist exists. No clean — evitem problemes amb muntatges read-only
  // sobre arxius existents. El build sobreescriu els fitxers generats.
  await ensureDir(DIST);

  const template = await readTemplate();

  const posts = await buildBlog(template);
  const projects = await buildPortfolio(template);
  await buildPages(template, posts, projects);
  await buildHome(template, posts, projects);
  await buildFeed(posts);
  await copyAssets();

  // .nojekyll per GitHub Pages
  await writeFile(join(DIST, ".nojekyll"), "", "utf8");

  console.log("\n✅ Fet! dist/ llest per publicar.");
}

main().catch(err => {
  console.error("❌", err);
  process.exit(1);
});
