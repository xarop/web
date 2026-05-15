/**
 * translate.js — Motor de traducció configurable
 *
 * TRANSLATE_ENGINE=claude|deepl|google|mymemory|libre  (default: claude)
 *
 * Variables per engine:
 *   claude    → ANTHROPIC_API_KEY
 *   deepl     → DEEPL_API_KEY  (gratis: console.deepl.com, 500k chars/mes)
 *   google    → (cap clau, però pot bloquejar IPs)
 *   mymemory  → MYMEMORY_EMAIL (opcional, augmenta quota de 5k → 50k chars/dia)
 *   libre     → LIBRE_URL  (default: https://libretranslate.com)
 *               LIBRE_API_KEY (opcional, moltes instàncies el requereixen)
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', 'translations');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Cache ────────────────────────────────────────────────────────────────────

function contentHash(...parts) {
  return createHash('sha256').update(parts.join('\x00')).digest('hex').slice(0, 16);
}

async function readCache(lang, key) {
  const p = join(CACHE_DIR, lang, `${key}.json`);
  if (!existsSync(p)) return null;
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return null; }
}

async function writeCache(lang, key, data) {
  await mkdir(join(CACHE_DIR, lang), { recursive: true });
  await writeFile(join(CACHE_DIR, lang, `${key}.json`), JSON.stringify(data, null, 2), 'utf8');
}

// ─── Protecció de la marca ────────────────────────────────────────────────────

const TOKEN = 'XR4P_T0K';
const protect = (t) => t.replace(/xarop/gi, TOKEN);
const restore = (t) => t.replace(new RegExp(TOKEN + '|XR\\s*4\\s*P.T\\s*0\\s*K', 'gi'), 'xarop');

// ─── Chunking per textos llargs ───────────────────────────────────────────────

function chunk(text, maxChars = 4000) {
  if (text.length <= maxChars) return [text];
  const parts = text.split('\n\n');
  const chunks = [];
  let cur = '';
  for (const p of parts) {
    if (cur && (cur + '\n\n' + p).length > maxChars) { chunks.push(cur); cur = p; }
    else cur = cur ? cur + '\n\n' + p : p;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

async function translateChunked(text, lang, engineFn, maxChars = 4000) {
  const s = String(text ?? '');
  if (!s.trim()) return s;
  const parts = chunk(s, maxChars);
  const out = [];
  for (const p of parts) out.push(String(await engineFn(p, lang)));
  return out.join('\n\n');
}

// ─── Engines ──────────────────────────────────────────────────────────────────

// 1. CLAUDE (Anthropic) --------------------------------------------------------
async function claudeEngine(text, lang) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic();
  const LANG_NAMES = { en: 'English', es: 'Spanish', sv: 'Swedish', it: 'Italian' };

  let attempts = 0;
  while (true) {
    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: `Translate to ${LANG_NAMES[lang]}. Return ONLY the translated text, no explanation.\n\n${text}` }],
      });
      return msg.content[0].text.trim();
    } catch (err) {
      if ((err?.status === 429 || err?.message?.includes('rate_limit')) && ++attempts <= 10) {
        const wait = 60000 + (attempts - 1) * 30000;
        process.stdout.write(`\n  ⏳ Rate limit — esperant ${wait / 1000}s… `);
        await sleep(wait);
      } else throw err;
    }
  }
}

// 2. DEEPL (gratis: console.deepl.com → 500k chars/mes) ----------------------
async function deeplEngine(text, lang) {
  const key = process.env.DEEPL_API_KEY;
  if (!key) throw new Error('DEEPL_API_KEY no configurada');
  const CODES = { en: 'EN-US', es: 'ES', sv: 'SV', it: 'IT' };
  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: { 'Authorization': `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: [text], target_lang: CODES[lang] }),
  });
  if (!res.ok) throw new Error(`DeepL error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const translated = data.translations?.[0]?.text;
  if (typeof translated !== 'string') throw new Error(`DeepL resposta inesperada: ${JSON.stringify(data)}`);
  return translated;
}

// 3. GOOGLE TRANSLATE (unofficial, gratis, pot bloquejar IPs) -----------------
async function googleEngine(text, lang) {
  const { translate } = await import('@vitalets/google-translate-api');
  let attempts = 0;
  while (true) {
    try {
      const res = await translate(text, { to: lang });
      await sleep(1500);
      return res.text;
    } catch (err) {
      if ((err.message?.includes('Too Many Requests') || err.statusCode === 429) && ++attempts <= 5) {
        const wait = 90000 * attempts;
        process.stdout.write(`\n  ⏳ Google rate limit — esperant ${wait / 1000}s… `);
        await sleep(wait);
      } else throw err;
    }
  }
}

// 4. MYMEMORY (gratis, 5k chars/dia; amb email: 50k chars/dia) ----------------
async function myMemoryEngine(text, lang) {
  const email = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : '';
  // MyMemory té límit de 500 chars per petició
  const chunks_ = chunk(text, 450);
  const out = [];
  for (const c of chunks_) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(c)}&langpair=ca|${lang}${email}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MyMemory error ${res.status}`);
    const data = await res.json();
    if (data.responseStatus !== 200) throw new Error(`MyMemory: ${data.responseDetails}`);
    out.push(data.responseData.translatedText);
    await sleep(500);
  }
  return out.join('\n\n');
}

// 5. LIBRETRANSLATE (open-source, self-hostable o instàncies públiques) --------
async function libreEngine(text, lang) {
  const url = (process.env.LIBRE_URL || 'https://libretranslate.com').replace(/\/$/, '');
  const body = { q: text, source: 'auto', target: lang, format: 'text' };
  if (process.env.LIBRE_API_KEY) body.api_key = process.env.LIBRE_API_KEY;
  const res = await fetch(`${url}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`LibreTranslate error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.translatedText;
}

// ─── Selecció d'engine ────────────────────────────────────────────────────────

const ENGINES = { claude: claudeEngine, deepl: deeplEngine, google: googleEngine, mymemory: myMemoryEngine, libre: libreEngine };
const MAX_CHARS = { claude: 12000, deepl: 50000, google: 4000, mymemory: 450, libre: 5000 };

function getEngine() {
  const name = (process.env.TRANSLATE_ENGINE || 'claude').toLowerCase();
  if (!ENGINES[name]) throw new Error(`Engine desconegut: "${name}". Opcions: ${Object.keys(ENGINES).join(', ')}`);
  return { fn: ENGINES[name], maxChars: MAX_CHARS[name] };
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function translateItem(lang, key, title, description, body) {
  const hash = contentHash(title, description || '', body);
  const cached = await readCache(lang, key);
  // Si existeix cache amb traducció vàlida, usar-la sempre (evita re-traduccions)
  // Forçar re-traducció: esborra el fitxer de cache o posa TRANSLATE_FORCE=1
  if (cached?.title && !process.env.TRANSLATE_FORCE) return cached;
  // Actualitzar hash si el contingut ha canviat
  if (cached && cached._hash === hash) return cached;

  // Sense cap clau/config, retorna contingut original
  const engine = process.env.TRANSLATE_ENGINE || 'claude';
  const needsKey = { claude: 'ANTHROPIC_API_KEY', deepl: 'DEEPL_API_KEY' };
  if (needsKey[engine] && !process.env[needsKey[engine]]) {
    return { title, description: description || '', body };
  }

  process.stdout.write(`  🌐 [${lang}] ${key}… `);
  try {
    const { fn, maxChars } = getEngine();
    const tr = async (text) => {
      const s = String(text ?? '');
      if (!s.trim()) return s;
      return restore(await translateChunked(protect(s), lang, fn, maxChars));
    };
    const tTitle = await tr(title);
    const tDesc  = await tr(description);
    const tBody  = await tr(body);

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
    results.push({ ...item, meta: { ...item.meta, title: t.title, description: t.description }, body: t.body });
    await sleep(800);
  }
  return results;
}
