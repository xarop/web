#!/usr/bin/env node

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = normalize(join(__dirname, ".."));
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.PORT || 4000);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function safePath(pathname) {
  const cleanPath = pathname.split("?")[0].split("#")[0];
  const decoded = decodeURIComponent(cleanPath || "/");
  const normalized = normalize(decoded).replace(/^([.][\\/])+/, "");

  if (normalized.includes("..")) {
    return null;
  }

  return normalized;
}

async function resolveFile(urlPath) {
  const safe = safePath(urlPath);
  if (safe === null) return null;

  let candidate = join(DIST, safe);

  if (safe.endsWith("/") || safe === "") {
    candidate = join(DIST, safe, "index.html");
  }

  if (existsSync(candidate)) {
    const fileStat = await stat(candidate);
    if (fileStat.isDirectory()) {
      const indexFile = join(candidate, "index.html");
      if (existsSync(indexFile)) return indexFile;
    } else {
      return candidate;
    }
  }

  // Friendly static-site fallback (e.g. /blog/post)
  const fallbackIndex = join(DIST, safe, "index.html");
  if (existsSync(fallbackIndex)) return fallbackIndex;

  return null;
}

const server = createServer(async (req, res) => {
  try {
    const method = req.method || "GET";
    if (method !== "GET" && method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Method Not Allowed");
      return;
    }

    const filePath = await resolveFile(req.url || "/");
    if (!filePath) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end("404 Not Found");
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const data = await readFile(filePath);

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });

    if (method === "HEAD") {
      res.end();
      return;
    }

    res.end(data);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    res.end("500 Internal Server Error");
    console.error("Serve error:", error);
  }
});

server.listen(PORT, () => {
  console.log(`Serving dist at http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop.");
});
