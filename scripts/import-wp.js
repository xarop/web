#!/usr/bin/env node
/**
 * Importa un export XML de WordPress (WXR) i genera fitxers Markdown
 * a content/blog/ i content/pages/.
 *
 * Ús: node scripts/import-wp.js <path-to-xml>
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import TurndownService from "turndown";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const XML_PATH = process.argv[2] || "/sessions/great-vigilant-mendel/mnt/uploads/xaropcom.WordPress.2026-04-23.xml";
const OUT_BLOG = join(ROOT, "content", "blog");
const OUT_PAGES = join(ROOT, "content", "pages");
const OUT_PORTFOLIO = join(ROOT, "content", "portfolio");
const MEDIA_LIST = join(ROOT, "content", "_media-urls.txt");

// ---------- Parsers ----------
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  cdataPropName: "#cdata",
  textNodeName: "#text",
  parseTagValue: false,
  trimValues: true,
});

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
});

// Per preservar figures i captions
turndown.addRule("figure", {
  filter: ["figure"],
  replacement: (content) => `\n\n${content}\n\n`,
});
turndown.addRule("figcaption", {
  filter: ["figcaption"],
  replacement: (content) => `\n> ${content}\n`,
});

// ---------- Helpers ----------
function getVal(node, key) {
  if (!node) return "";
  const v = node[key];
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(x => getVal({ x }, "x")).join(", ");
  if (typeof v === "object") return v["#cdata"] ?? v["#text"] ?? "";
  return String(v);
}

function slugify(s) {
  return String(s).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim().replace(/[\s_]+/g, "-")
    .slice(0, 80) || "post";
}

function yamlEscape(s) {
  if (s == null) return "";
  const str = String(s).replace(/\r/g, "");
  if (/[:#\-&*!\|>'"%@`]|^\s|\s$/.test(str) || str.includes("\n")) {
    return '"' + str.replace(/"/g, '\\"').replace(/\n/g, " ") + '"';
  }
  return str;
}

function stripWpShortcodes(html) {
  const s = String(html || "");
  return s
    .replace(/\[\/?[a-z][a-z0-9_-]*[^\]]*\]/gi, "")
    .replace(/<!--\s*\/?wp:[^>]*-->/g, "")
    .replace(/<!--\s*\/wp:[^>]*-->/g, "");
}

function cleanHtml(html) {
  if (!html) return "";
  let h = stripWpShortcodes(html);
  h = String(h).replace(/\n{3,}/g, "\n\n");
  return h;
}

function mdFromHtml(html) {
  if (!html || !html.trim()) return "";
  try {
    return turndown.turndown(html).replace(/\n{3,}/g, "\n\n").trim();
  } catch (e) {
    console.warn("turndown failed:", e.message);
    return html;
  }
}

// ---------- Extract categories ----------
function extractCategories(item) {
  const cats = [];
  const tags = [];
  const raw = item.category;
  if (!raw) return { cats, tags };
  const arr = Array.isArray(raw) ? raw : [raw];
  for (const c of arr) {
    const name = c["#cdata"] || c["#text"] || "";
    const domain = c["@domain"];
    if (!name) continue;
    if (domain === "post_tag") tags.push(name);
    else if (domain === "category") cats.push(name);
  }
  return { cats, tags };
}

// ---------- Main ----------
async function main() {
  console.log("📖 Llegint", XML_PATH);
  const xml = await readFile(XML_PATH, "utf8");

  console.log("🔍 Parsejant XML…");
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item || [];
  console.log(`   ${items.length} items`);

  await mkdir(OUT_BLOG, { recursive: true });
  await mkdir(OUT_PAGES, { recursive: true });
  await mkdir(OUT_PORTFOLIO, { recursive: true });

  const mediaUrls = new Set();
  const stats = { posts: 0, pages: 0, portfolio: 0, attachments: 0, skipped: 0 };
  const slugsUsed = new Set();

  // Slugs reservats per a pàgines del sistema
  const reservedPageSlugs = new Set(["index", "blog", "portfolio", "contacte", "cv", "home"]);

  for (const item of items) {
    const type = getVal(item, "wp:post_type");
    const status = getVal(item, "wp:status");
    const title = getVal(item, "title");
    let slug = getVal(item, "wp:post_name") || slugify(title);
    const dateGmt = getVal(item, "wp:post_date_gmt");
    const dateStr = dateGmt && dateGmt !== "0000-00-00 00:00:00"
      ? dateGmt.slice(0, 10)
      : getVal(item, "wp:post_date").slice(0, 10) || "";
    const link = getVal(item, "link");
    const excerpt = getVal(item, "excerpt:encoded");
    const contentRaw = getVal(item, "content:encoded");
    const content = cleanHtml(contentRaw);
    const { cats, tags } = extractCategories(item);

    if (status === "trash" || status === "auto-draft") { stats.skipped++; continue; }

    // Attachments: guardem les URLs per saber quins medis cal descarregar
    if (type === "attachment") {
      const url = getVal(item, "wp:attachment_url");
      if (url) mediaUrls.add(url);
      stats.attachments++;
      continue;
    }

    if (type !== "post" && type !== "page") { stats.skipped++; continue; }
    if (!title && !content) { stats.skipped++; continue; }

    const md = mdFromHtml(content);
    if (!md.trim() && type === "post") { stats.skipped++; continue; }

    // Detecta portfolio: categoria "portfolio" o "projectes" → portfolio
    const catLower = cats.map(c => c.toLowerCase());
    const isPortfolio = catLower.some(c => /portfolio|projecte|project/.test(c));

    // Front-matter
    const fm = [];
    fm.push(`title: ${yamlEscape(title || "(sense títol)")}`);
    if (dateStr) fm.push(`date: ${dateStr}`);
    if (excerpt) fm.push(`description: ${yamlEscape(excerpt.slice(0, 200))}`);
    if (tags.length) fm.push(`tags: [${tags.map(t => yamlEscape(t)).join(", ")}]`);
    if (cats.length) fm.push(`categories: [${cats.map(c => yamlEscape(c)).join(", ")}]`);
    if (link) fm.push(`originalUrl: ${yamlEscape(link)}`);

    let outDir, section;
    if (type === "page") {
      // Evita col·lidir amb pàgines reservades
      if (reservedPageSlugs.has(slug)) slug = `${slug}-wp`;
      outDir = OUT_PAGES;
      section = "pages";
    } else if (isPortfolio) {
      outDir = OUT_PORTFOLIO;
      section = "portfolio";
    } else {
      outDir = OUT_BLOG;
      section = "blog";
    }

    // Prefixa data si no té per ordenar bé (opcional)
    // slug únic
    let finalSlug = slug;
    let i = 1;
    while (slugsUsed.has(`${section}/${finalSlug}`)) finalSlug = `${slug}-${i++}`;
    slugsUsed.add(`${section}/${finalSlug}`);

    const body = `---\n${fm.join("\n")}\n---\n\n${md}\n`;
    await writeFile(join(outDir, `${finalSlug}.md`), body, "utf8");

    // Extreu URLs d'imatges del contingut
    const urlRegex = /https?:\/\/[^\s)"']+\.(jpg|jpeg|png|gif|svg|webp|mp4|mp3|pdf)/gi;
    const found = String(contentRaw || "").match(urlRegex) || [];
    found.forEach(u => mediaUrls.add(u));

    stats[section === "pages" ? "pages" : section === "portfolio" ? "portfolio" : "posts"]++;
  }

  // Escriu llista de medis
  const mediaList = [...mediaUrls].sort().join("\n");
  await writeFile(MEDIA_LIST, mediaList + "\n", "utf8");

  console.log("\n📊 Resultat:");
  console.log(`   Posts:      ${stats.posts}`);
  console.log(`   Pages:      ${stats.pages}`);
  console.log(`   Portfolio:  ${stats.portfolio}`);
  console.log(`   Attachments: ${stats.attachments}`);
  console.log(`   Skipped:    ${stats.skipped}`);
  console.log(`   Media URLs: ${mediaUrls.size} (guardades a ${MEDIA_LIST})`);
  console.log("\n✅ Importació completada");
}

main().catch(err => {
  console.error("❌", err);
  process.exit(1);
});
