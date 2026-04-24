#!/usr/bin/env node
/**
 * Fa screenshots de les URLs dels projectes/posts que no tenen image:.
 * Guarda com WebP (1200px wide, q82) a src/assets/images/.
 * Actualitza el front-matter image: al .md.
 *
 * Ús: node scripts/screenshot.js
 */

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import sharp from "sharp";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT_DIRS = [join(ROOT, "content", "blog"), join(ROOT, "content", "portfolio")];
const IMG_DST = join(ROOT, "src", "assets", "images");

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

function slugFromPath(filePath) {
  return basename(filePath, ".md");
}

async function main() {
  await ensureDir(IMG_DST);

  // Recull fitxers que tenen url: però no image:
  const targets = [];
  for (const dir of CONTENT_DIRS) {
    if (!existsSync(dir)) continue;
    const files = (await readdir(dir)).filter(f => f.endsWith(".md"));
    for (const file of files) {
      const filePath = join(dir, file);
      const content = await readFile(filePath, "utf8");
      const hasUrl = /^url:\s*https?:\/\/\S+/m.test(content);
      const hasImage = /^image:/m.test(content);
      if (hasUrl && !hasImage) {
        const urlMatch = content.match(/^url:\s*(https?:\/\/\S+?)\s*$/m);
        if (urlMatch) targets.push({ filePath, url: urlMatch[1], slug: slugFromPath(file) });
      }
    }
  }

  if (!targets.length) {
    console.log("Cap fitxer sense image: i amb url:. Tot ja té imatge.");
    return;
  }

  console.log(`${targets.length} fitxer(s) per fer screenshot:\n`);
  targets.forEach(t => console.log(`  ${t.slug} → ${t.url}`));
  console.log();

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let done = 0, errors = 0;

  for (const { filePath, url, slug } of targets) {
    const webpName = `screenshot-${slug}.webp`;
    const destPath = join(IMG_DST, webpName);
    const localRef = `assets/images/${webpName}`;

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      // Espera mínima per assegurar renders (fonts, images)
      await new Promise(r => setTimeout(r, 800));

      const pngBuf = await page.screenshot({ type: "png" });
      await page.close();

      // Converteix a WebP: crop a 16:7, max 1200px
      await sharp(pngBuf)
        .resize({ width: 1200, height: 525, fit: "cover", position: "top" })
        .webp({ quality: 82 })
        .toFile(destPath);

      // Actualitza el .md (gestiona CRLF i LF)
      let content = await readFile(filePath, "utf8");
      const le = content.includes("\r\n") ? "\r\n" : "\n";
      content = content.replace(/^---[ \t]*[\r\n]+/, `---${le}image: ${localRef}${le}`);
      await writeFile(filePath, content, "utf8");

      console.log(`✓ ${webpName}`);
      done++;
    } catch (e) {
      console.error(`✗ ${slug}: ${e.message}`);
      errors++;
    }
  }

  await browser.close();
  console.log(`\nFets: ${done} · Errors: ${errors}`);
}

main().catch(console.error);
