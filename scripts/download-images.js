#!/usr/bin/env node
/**
 * Descarrega les imatges destacades des de URLs externes (WordPress),
 * les converteix a WebP (max 1200px, q82) i actualitza els .md.
 *
 * Ús: node scripts/download-images.js
 */

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT_DIRS = [join(ROOT, "content", "blog"), join(ROOT, "content", "portfolio")];
const IMG_DST = join(ROOT, "src", "assets", "images");

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processImage(url, destPath) {
  const buf = await downloadBuffer(url);
  await sharp(buf)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destPath);
}

async function main() {
  await ensureDir(IMG_DST);

  let downloaded = 0, skipped = 0, errors = 0;

  for (const dir of CONTENT_DIRS) {
    if (!existsSync(dir)) continue;
    const files = (await readdir(dir)).filter(f => f.endsWith(".md"));

    for (const file of files) {
      const filePath = join(dir, file);
      let content = await readFile(filePath, "utf8");

      // Troba línies image: amb URL externa (gestiona CRLF i LF)
      const match = content.match(/^image:\s*(https?:\/\/\S+?)\s*$/m);
      if (!match) continue;

      const url = match[1];
      const origBase = basename(url);
      const webpName = origBase.replace(/\.[^.]+$/, "") + ".webp";
      const destPath = join(IMG_DST, webpName);
      const localRef = `assets/images/${webpName}`;

      // Si ja existeix, actualitza només el .md si cal
      if (existsSync(destPath)) {
        if (!content.includes(localRef)) {
          content = content.replace(/^image:\s*https?:\/\/\S+/m, `image: ${localRef}`);
          await writeFile(filePath, content, "utf8");
        }
        skipped++;
        continue;
      }

      try {
        await processImage(url, destPath);
        content = content.replace(/^image:\s*https?:\/\/\S+/m, `image: ${localRef}`);
        await writeFile(filePath, content, "utf8");
        console.log(`✓ ${webpName}`);
        downloaded++;
      } catch (e) {
        console.error(`✗ ${origBase}: ${e.message}`);
        errors++;
      }
    }
  }

  console.log(`\nDescarregades: ${downloaded} · Ja existien: ${skipped} · Errors: ${errors}`);
}

main().catch(console.error);
