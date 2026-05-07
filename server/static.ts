import express from "express";
import type { Express, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { injectMeta, readIndexHtml } from "./seo";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Long-lived cache for hashed Vite assets, short for everything else.
  // `index: false` disables the automatic index.html serving for `/` — that
  // request must flow through the SPA fallback below so meta is injected.
  app.use(
    express.static(distPath, {
      index: false,
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        if (/\/assets\//.test(filePath)) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable",
          );
        } else if (/\.html$/.test(filePath)) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  // SPA fallback with route-aware SEO meta injection. Skips API and asset
  // requests so those are handled elsewhere or 404 cleanly.
  app.get(/.*/, (req: Request, res: Response) => {
    const pathname = req.path;
    if (pathname.startsWith("/api/")) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }
    const html = readIndexHtml(distPath);
    if (!html) {
      return res.status(500).send("index.html missing");
    }
    const injected = injectMeta(html, pathname);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(injected);
  });
}
