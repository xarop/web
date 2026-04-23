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

import { readFile, writeFile, mkdir, readdir, copyFile, rm } from "node:fs/promises";
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
  return marked.parse(md);
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
  await writeFile(outPath, html, "utf8");
  console.log("  →", outPath.slice(DIST.length + 1) || "index.html");
}

// ---------- Build pages ----------

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
    const tags = (p.meta.tags || []).map(t => `<a class="tag" href="../tags/${slugify(t)}/">#${t}</a>`).join(" ");
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
      ${tags}
    </p>
  </header>
  ${body}
  <hr style="margin-top:3rem;border:0;border-top:1px solid var(--color-border)">
  <p><a href="../">← tornar al blog</a></p>
</article>`,
    }, template);
  }

  return posts;
}

async function buildPortfolio(template) {
  const projects = await readMarkdownDir(join(CONTENT, "portfolio"));
  console.log(`\n💼 Portfolio: ${projects.length} projectes`);

  const grid = projects.map(p => `
    <li>
      <a href="./${p.slug}/">
        <h3>${p.meta.title}</h3>
        ${p.meta.role ? `<p class="meta">${p.meta.role}${p.meta.year ? ` · ${p.meta.year}` : ""}</p>` : ""}
        ${p.meta.description ? `<p>${p.meta.description}</p>` : ""}
      </a>
    </li>`).join("");

  await writePage(join(DIST, "portfolio", "index.html"), {
    title: "Portfolio",
    section: "portfolio",
    description: "Projectes seleccionats.",
    content: `
<header><h1>Portfolio</h1><p class="meta">${projects.length} projectes seleccionats</p></header>
<ul class="project-list">${grid}</ul>`,
  }, template);

  for (const p of projects) {
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
      ${p.meta.role ? p.meta.role : ""}
      ${p.meta.year ? ` · ${p.meta.year}` : ""}
      ${p.meta.url ? ` · <a href="${p.meta.url}" rel="noopener">visita →</a>` : ""}
    </p>
  </header>
  ${body}
  <hr style="margin-top:3rem;border:0;border-top:1px solid var(--color-border)">
  <p><a href="../">← tornar al portfolio</a></p>
</article>`,
    }, template);
  }

  return projects;
}

async function buildPages(template) {
  const pages = await readMarkdownDir(join(CONTENT, "pages"));
  console.log(`\n📄 Pàgines: ${pages.length}`);

  for (const p of pages) {
    const body = htmlFromMarkdown(p.body);
    const isHome = p.slug === "index" || p.slug === "home";
    const outPath = isHome
      ? join(DIST, "index.html")
      : join(DIST, p.slug, "index.html");

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

  const featured = projects.slice(0, 4).map(p => `
    <li><a href="./portfolio/${p.slug}/"><h3>${p.meta.title}</h3>${p.meta.description ? `<p>${p.meta.description}</p>` : ""}</a></li>
  `).join("");

  await writePage(indexPath, {
    title: SITE.title,
    section: "home",
    description: SITE.description,
    content: `
<article>
  <h1>hola, sóc <em>xarop</em>.</h1>
  <p>Front-end engineer. Escric codi, a vegades també paraules. Aquí trobaràs el meu <a href="./blog/">blog</a>, el meu <a href="./portfolio/">portfolio</a> i el meu <a href="./cv/">cv</a>.</p>
  <p class="meta">xarop vol dir <em>xarop</em> en català. Aquest lloc té sabors — tria'n un al peu ↓.</p>
</article>

${posts.length ? `
<section>
  <h2>Darrers articles</h2>
  <ol class="post-list">${recent}</ol>
  <p><a href="./blog/">tots els articles →</a></p>
</section>` : ""}

${projects.length ? `
<section>
  <h2>Projectes</h2>
  <ul class="project-list">${featured}</ul>
  <p><a href="./portfolio/">tots els projectes →</a></p>
</section>` : ""}`,
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

  // Assets
  if (existsSync(join(SRC, "assets"))) {
    const aDst = join(DIST, "assets");
    await ensureDir(aDst);
    for (const f of await readdir(join(SRC, "assets"))) {
      await copyFile(join(SRC, "assets", f), join(aDst, f));
    }
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
  await buildPages(template);
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
