#!/usr/bin/env node
/**
 * Importa comentaris de WordPress a GitHub Discussions (giscus)
 *
 * Requisits:
 *   1. GitHub Discussions activat al repo
 *   2. App giscus instal·lada al repo
 *   3. Token de GitHub amb scope 'write:discussion':
 *      https://github.com/settings/tokens/new?scopes=write:discussion
 *
 * Ús:
 *   GITHUB_TOKEN=ghp_... node scripts/import-wp-comments.js
 *   GITHUB_TOKEN=ghp_... node scripts/import-wp-comments.js --dry-run
 */

import { readFile, readdir } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const REPO_OWNER  = "xarop";
const REPO_NAME   = "web";
const REPO_ID     = "R_kgDOSKW4Ew";
const CATEGORY_ID = "DIC_kwDOSKW4E84C73Kj";
const SITE_URL    = "https://xarop.com";
const DRY_RUN     = process.argv.includes("--dry-run");
const TOKEN       = process.env.GITHUB_TOKEN;

if (!TOKEN && !DRY_RUN) {
  console.error("Cal definir GITHUB_TOKEN. Exemple:");
  console.error("  GITHUB_TOKEN=ghp_... node scripts/import-wp-comments.js");
  process.exit(1);
}

// ---------- GitHub GraphQL ----------

async function graphql(query, variables = {}, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) {
      const msg = json.errors.map(e => e.message).join("; ");
      const isRateLimit = msg.includes("too quickly") || msg.includes("secondary rate");
      if (isRateLimit && attempt < retries) {
        const wait = 15000 * (attempt + 1);
        process.stdout.write(` [limit, ${wait / 1000}s...] `);
        await sleep(wait);
        continue;
      }
      throw new Error(msg);
    }
    return json.data;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findDiscussion(pathname) {
  const q = `repo:${REPO_OWNER}/${REPO_NAME} in:title "${pathname}"`;
  const data = await graphql(
    `query($q:String!){search(type:DISCUSSION,query:$q,first:5){nodes{...on Discussion{id title url comments(first:1){totalCount}}}}}`,
    { q }
  );
  return data.search.nodes.find(n => n.title === pathname) || null;
}

async function addComment(discussionId, body, replyToId) {
  try {
    const res = await graphql(
      `mutation($dId:ID!,$body:String!,$r:ID){addDiscussionComment(input:{discussionId:$dId,body:$body,replyToId:$r}){comment{id}}}`,
      { dId: discussionId, body, r: replyToId ?? null }
    );
    return res.addDiscussionComment.comment.id;
  } catch (err) {
    // GitHub no suporta threading de 2n nivell → afegeix sense pare
    if (replyToId && (err.message.includes("thread") || err.message.includes("reply"))) {
      const res = await graphql(
        `mutation($dId:ID!,$body:String!){addDiscussionComment(input:{discussionId:$dId,body:$body}){comment{id}}}`,
        { dId: discussionId, body }
      );
      return res.addDiscussionComment.comment.id;
    }
    throw err;
  }
}

// ---------- Parse WordPress XML ----------

function parseCDATA(str) {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, c) => c).trim();
}

function field(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return m ? parseCDATA(m[1]) : "";
}

function parseComments(itemXml) {
  const comments = [];
  for (const [, cx] of itemXml.matchAll(/<wp:comment>([\s\S]*?)<\/wp:comment>/g)) {
    if (field(cx, "wp:comment_approved") !== "1") continue;
    const type = field(cx, "wp:comment_type");
    if (type && type !== "comment") continue; // descarta pingbacks/trackbacks
    comments.push({
      wpId:    field(cx, "wp:comment_id"),
      author:  field(cx, "wp:comment_author") || "Anònim",
      date:    field(cx, "wp:comment_date").slice(0, 10),
      content: field(cx, "wp:comment_content"),
      parent:  field(cx, "wp:comment_parent"),
    });
  }
  return comments;
}

// ---------- Main ----------

async function run() {
  const xml       = await readFile(join(ROOT, "content/xaropcom.WordPress.2026-04-23.xml"), "utf8");
  const blogSlugs = new Set(
    (await readdir(join(ROOT, "content/blog"))).map(f => basename(f, ".md"))
  );

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);

  const posts = [];
  for (const item of items) {
    const slug   = field(item, "wp:post_name");
    const type   = field(item, "wp:post_type");
    const status = field(item, "wp:status");
    if (type !== "post" || status !== "publish" || !slug) continue;
    if (!blogSlugs.has(slug)) continue;
    const comments = parseComments(item);
    if (comments.length === 0) continue;
    comments.sort((a, b) => a.date.localeCompare(b.date) || Number(a.wpId) - Number(b.wpId));
    posts.push({ slug, comments });
  }

  const total = posts.reduce((s, p) => s + p.comments.length, 0);
  console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${posts.length} posts · ${total} comentaris\n`);

  for (const post of posts) {
    const pathname = `/blog/${post.slug}/`;
    const url      = `${SITE_URL}${pathname}`;
    console.log(`→ ${pathname} (${post.comments.length})`);

    if (DRY_RUN) {
      post.comments.forEach(c =>
        console.log(`  💬 ${c.author} (${c.date})${c.parent !== "0" ? " ↩" : ""}`)
      );
      continue;
    }

    // Comprova si ja existeix
    const existing = await findDiscussion(pathname);
    let discussionId;

    if (existing) {
      if (existing.comments.totalCount > 0) {
        console.log(`  ✓ ja processat (${existing.comments.totalCount} comentaris)`);
        continue;
      }
      console.log(`  (discussion existent sense comentaris) ${existing.url}`);
      discussionId = existing.id;
    } else {
      const res = await graphql(
        `mutation($rId:ID!,$cId:ID!,$t:String!,$b:String!){createDiscussion(input:{repositoryId:$rId,categoryId:$cId,title:$t,body:$b}){discussion{id url}}}`,
        { rId: REPO_ID, cId: CATEGORY_ID, t: pathname, b: url }
      );
      discussionId = res.createDiscussion.discussion.id;
      console.log("  ", res.createDiscussion.discussion.url);
      await sleep(2000);
    }

    // WP comment id → GitHub comment id (per threading de 1r nivell)
    const idMap = new Map();

    for (const c of post.comments) {
      const parentGhId = c.parent !== "0" ? idMap.get(c.parent) : undefined;
      const body = `**${c.author}** · *${c.date}*\n\n${c.content}`;

      const ghId = await addComment(discussionId, body, parentGhId);
      idMap.set(c.wpId, ghId);
      process.stdout.write(".");
      await sleep(1500);
    }
    process.stdout.write("\n");
  }

  console.log("\n✅ Fet!");
}

run().catch(err => {
  console.error("\n❌", err.message);
  process.exit(1);
});
