import { translate } from '@vitalets/google-translate-api';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', 'translations');

const GT_LANG = { en: 'en', es: 'es', sv: 'sv', it: 'it' };
const CHUNK_SIZE = 4000;

// Delays (ms)
const DELAY_BETWEEN_CALLS = 1500;   // entre cada crida a GT
const DELAY_BETWEEN_ITEMS = 800;    // entre ítems
const DELAY_ON_RATELIMIT  = 90000;  // 90s quan rebem 429

function contentHash(title, description, body) {
  return createHash('sha256')
    .update([title, description || '', body].join('\x00'))
    .digest('hex').slice(0, 16);
}

async function readCache(lang, key) {
  const path = join(CACHE_DIR, lang, `${key}.json`);
  if (!existsSync(path)) return null;
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return null; }
}

async function writeCache(lang, key, data) {
  const dir = join(CACHE_DIR, lang);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${key}.json`), JSON.stringify(data, null, 2), 'utf8');
}

const BRAND_TOKEN = 'XR4P_T0K';
function protectBrand(text) {
  return text.replace(/xarop/gi, BRAND_TOKEN);
}
function restoreBrand(text) {
  return text.replace(new RegExp(BRAND_TOKEN, 'gi'), 'xarop')
             .replace(/XR\s*4\s*P[_\s]T\s*0\s*K/gi, 'xarop');
}

function chunkText(text) {
  if (text.length <= CHUNK_SIZE) return [text];
  const paras = text.split('\n\n');
  const chunks = [];
  let current = '';
  for (const p of paras) {
    if (current && (current + '\n\n' + p).length > CHUNK_SIZE) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function gtCall(text, lang) {
  let attempts = 0;
  while (true) {
    try {
      const res = await translate(text, { to: GT_LANG[lang] });
      await sleep(DELAY_BETWEEN_CALLS);
      return res.text;
    } catch (err) {
      const is429 = err.message?.includes('Too Many Requests') || err.statusCode === 429;
      attempts++;
      if (is429 && attempts <= 5) {
        const wait = DELAY_ON_RATELIMIT * attempts;
        process.stdout.write(`\n  ⏳ Rate limit — esperant ${wait / 1000}s…`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
}

async function gtTranslate(text, lang) {
  if (!text.trim()) return text;
  const protected_ = protectBrand(text);
  const chunks = chunkText(protected_);
  const results = [];
  for (const chunk of chunks) {
    results.push(await gtCall(chunk, lang));
  }
  return restoreBrand(results.join('\n\n'));
}

export async function translateItem(lang, key, title, description, body) {
  const hash = contentHash(title, description, body);
  const cached = await readCache(lang, key);
  if (cached && cached._hash === hash) return cached;

  process.stdout.write(`  🌐 [${lang}] ${key}… `);
  try {
    // Seqüencial (no paral·lel) per evitar rate limit
    const tTitle = await gtTranslate(title, lang);
    const tDesc  = await gtTranslate(description || '', lang);
    const tBody  = await gtTranslate(body, lang);

    const result = { _hash: hash, title: tTitle, description: tDesc, body: tBody };
    await writeCache(lang, key, result);
    process.stdout.write('✓\n');
    return result;
  } catch (err) {
    process.stdout.write(`❌ ${err.message}\n`);
    return { title, description: description || '', body };
  }
}

export async function translateAll(lang, items, type) {
  const results = [];
  for (const item of items) {
    const t = await translateItem(lang, `${type}-${item.slug}`, item.meta.title, item.meta.description, item.body);
    results.push({
      ...item,
      meta: { ...item.meta, title: t.title, description: t.description },
      body: t.body,
    });
    await sleep(DELAY_BETWEEN_ITEMS);
  }
  return results;
}
