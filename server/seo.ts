import type { Express, Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { db } from "./storage";
import { uploadedPrayers } from "@shared/schema";
import { eq } from "drizzle-orm";

const DEFAULT_SITE_URL = "https://www.holyspiritprayers.com";

export function getSiteUrl(): string {
  return (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonLdSafe(value: unknown): string {
  // JSON.stringify already escapes quotes; additionally guard against `</script`
  return JSON.stringify(value).replace(/<\/script/gi, "<\\/script");
}

type MetaContext = {
  title: string;
  description: string;
  canonical: string;
  ogType: "website" | "article" | "product";
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: unknown[];
};

function truncate(s: string, max: number): string {
  if (!s) return "";
  const trimmed = s.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

const SITE_NAME = "Holy Spirit Prayers";
const DEFAULT_DESCRIPTION =
  "Stream Bible-centered prayers, download audio prayers, and request personalized custom prayers. Spirit-led, Scripture-rooted, non-denominational.";

function organizationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
  };
}

function websiteSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
  };
}

function staticMeta(pathname: string, siteUrl: string): MetaContext | null {
  const canonical = `${siteUrl}${pathname === "/" ? "" : pathname}`;
  switch (pathname) {
    case "/":
      return {
        title: `${SITE_NAME} — Spirit-led prayers rooted in Scripture`,
        description: DEFAULT_DESCRIPTION,
        canonical,
        ogType: "website",
        jsonLd: [organizationSchema(siteUrl), websiteSchema(siteUrl)],
      };
    case "/library":
      return {
        title: `Prayer Library — ${SITE_NAME}`,
        description:
          "Browse Spirit-led, Scripture-rooted prayer audio you can stream or download. Find prayers for healing, peace, faith, family, and more.",
        canonical,
        ogType: "website",
      };
    case "/custom-prayer":
    case "/request-prayer":
      return {
        title: `Request a Custom Prayer — ${SITE_NAME}`,
        description:
          "Request a personalized, Spirit-led prayer rooted in Scripture. Delivered in 24–48 hours as audio, text, or both.",
        canonical: `${siteUrl}/custom-prayer`,
        ogType: "website",
      };
    case "/about":
      return {
        title: `About — ${SITE_NAME}`,
        description: `About ${SITE_NAME}: our mission to deliver Spirit-led, Scripture-rooted prayers.`,
        canonical,
        ogType: "website",
      };
    case "/contact":
      return {
        title: `Contact — ${SITE_NAME}`,
        description: "Get in touch with our team. Responses within 1–2 business days.",
        canonical,
        ogType: "website",
      };
    case "/legal":
      return {
        title: `Legal — ${SITE_NAME}`,
        description: "Terms, privacy, and legal notices.",
        canonical,
        ogType: "website",
      };
    case "/privacy":
    case "/privacy-policy":
    case "/legal/privacy":
      return {
        title: `Privacy Policy — ${SITE_NAME}`,
        description:
          "How Holy Spirit Prayers collects, uses, and protects your personal information.",
        canonical: `${siteUrl}/legal/privacy`,
        ogType: "website",
      };
    case "/terms":
    case "/terms-of-service":
    case "/legal/terms":
      return {
        title: `Terms of Service — ${SITE_NAME}`,
        description:
          "The agreement between you and Holy Spirit Prayers when you use the Service.",
        canonical: `${siteUrl}/legal/terms`,
        ogType: "website",
      };
    case "/cookies":
    case "/cookie-policy":
    case "/legal/cookies":
      return {
        title: `Cookie Policy — ${SITE_NAME}`,
        description:
          "How Holy Spirit Prayers uses cookies and how to manage your preferences.",
        canonical: `${siteUrl}/legal/cookies`,
        ogType: "website",
      };
    case "/california-privacy":
    case "/do-not-sell":
    case "/legal/california":
      return {
        title: `California Privacy Notice — ${SITE_NAME}`,
        description:
          "Your CCPA/CPRA rights and the Holy Spirit Prayers Do Not Sell or Share commitment.",
        canonical: `${siteUrl}/legal/california`,
        ogType: "website",
      };
    case "/gdpr":
    case "/legal/gdpr":
      return {
        title: `GDPR & Data Rights — ${SITE_NAME}`,
        description:
          "Your data rights under GDPR and how to exercise them with Holy Spirit Prayers.",
        canonical: `${siteUrl}/legal/gdpr`,
        ogType: "website",
      };
    case "/disclaimer":
    case "/legal/disclaimer":
      return {
        title: `Faith & Legal Disclaimer — ${SITE_NAME}`,
        description:
          "Prayers offered by Holy Spirit Prayers are spiritual resources, not professional advice.",
        canonical: `${siteUrl}/legal/disclaimer`,
        ogType: "website",
      };
    case "/refunds":
    case "/legal/refunds":
      return {
        title: `Refund Policy — ${SITE_NAME}`,
        description: "When and how Holy Spirit Prayers issues refunds.",
        canonical: `${siteUrl}/legal/refunds`,
        ogType: "website",
      };
    case "/privacy-choices":
    case "/your-privacy-choices":
      return {
        title: `Your Privacy Choices — ${SITE_NAME}`,
        description:
          "Submit a data access, deletion, correction, or opt-out request and manage your cookie preferences.",
        canonical: `${siteUrl}/privacy-choices`,
        ogType: "website",
      };
    case "/login":
    case "/register":
    case "/forgot-password":
    case "/reset-password":
      return {
        title: `Sign in — ${SITE_NAME}`,
        description: "Sign in to your account.",
        canonical,
        ogType: "website",
        noindex: true,
      };
    case "/account":
    case "/dashboard":
      return {
        title: `Your Account — ${SITE_NAME}`,
        description: "Your purchases, subscription, and saved prayers.",
        canonical: `${siteUrl}/account`,
        ogType: "website",
        noindex: true,
      };
    default:
      if (pathname.startsWith("/admin")) {
        return {
          title: `Admin — ${SITE_NAME}`,
          description: "Restricted area.",
          canonical,
          ogType: "website",
          noindex: true,
        };
      }
      if (pathname.startsWith("/legal/")) {
        const section = pathname.slice("/legal/".length).replace(/[^a-z0-9-]/gi, "");
        return {
          title: `Legal — ${section || ""} ${SITE_NAME}`.trim(),
          description: "Legal notices.",
          canonical,
          ogType: "website",
        };
      }
      return null;
  }
}

function prayerMeta(id: number, siteUrl: string): MetaContext | null {
  let row;
  try {
    row = db
      .select()
      .from(uploadedPrayers)
      .where(eq(uploadedPrayers.id, id))
      .get();
  } catch {
    row = undefined;
  }
  if (!row) return null;

  const title = `${row.title} — ${SITE_NAME}`;
  const descriptionSource =
    row.description ||
    row.aboutPrayer ||
    row.categoryDescription ||
    row.bibleTheme ||
    DEFAULT_DESCRIPTION;
  const description = truncate(descriptionSource, 200);
  const canonical = `${siteUrl}/prayer/${row.id}`;

  const isFree = !!row.isFree;
  const priceCents = isFree ? 0 : 700;

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Prayer Library", item: `${siteUrl}/library` },
      {
        "@type": "ListItem",
        position: 3,
        name: row.title,
        item: canonical,
      },
    ],
  };

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: row.title,
    description,
    url: canonical,
    category: row.categorySlug || undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "USD",
      price: (priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  const creativeWork = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: row.title,
    description,
    url: canonical,
    inLanguage: "en",
    isAccessibleForFree: isFree,
    keywords: [row.categorySlug, row.bibleTheme, row.scriptureReference]
      .filter(Boolean)
      .join(", "),
    citation: row.scriptureReference || undefined,
  };

  return {
    title,
    description,
    canonical,
    ogType: "product",
    jsonLd: [breadcrumbs, product, creativeWork],
  };
}

function buildHead(meta: MetaContext, siteUrl: string): string {
  const robots = meta.noindex ? "noindex, nofollow" : "index, follow";
  const ogImage = meta.ogImage || `${siteUrl}/favicon.svg`;
  const parts = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
  ];
  if (meta.jsonLd && meta.jsonLd.length) {
    for (const obj of meta.jsonLd) {
      parts.push(
        `<script type="application/ld+json">${jsonLdSafe(obj)}</script>`,
      );
    }
  }
  return parts.join("\n    ");
}

function defaultMetaForPath(pathname: string, siteUrl: string): MetaContext {
  // Match /prayer/:id with numeric id
  const prayerMatch = /^\/prayer\/(\d+)\/?$/.exec(pathname);
  if (prayerMatch) {
    const id = Number(prayerMatch[1]);
    const m = prayerMeta(id, siteUrl);
    if (m) return m;
    // Fall back to a generic prayer page
    return {
      title: `Prayer — ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      canonical: `${siteUrl}/library`,
      ogType: "website",
    };
  }
  const m = staticMeta(pathname, siteUrl);
  if (m) return m;
  // Fallback for unknown paths — use the homepage meta with the requested URL as canonical
  return {
    title: `${SITE_NAME} — Spirit-led prayers rooted in Scripture`,
    description: DEFAULT_DESCRIPTION,
    canonical: `${siteUrl}${pathname}`,
    ogType: "website",
  };
}

const HEAD_PLACEHOLDER_REGEX = /<head>([\s\S]*?)<\/head>/i;
const TITLE_REGEX = /<title>[\s\S]*?<\/title>/i;
const DESC_REGEX = /<meta\s+name="description"[^>]*\/?>(?:)/i;
const OG_REGEX = /<meta\s+property="og:[^"]+"[^>]*\/?>(?:)/gi;

// Rewrite Vite's relative asset references (./assets/...) to absolute /assets/
// paths so deep routes like /prayer/123 don't try to load /prayer/assets/...
// We keep the build output relative (vite base "./") so the bundle still works
// when a static host mounts dist/public under a sub-path; on Express we always
// serve from root and need absolute references.
const RELATIVE_ASSET_ATTR_REGEX =
  /(\b(?:src|href)\s*=\s*["'])\.\/(assets\/[^"']+)(["'])/gi;

function absolutizeAssetUrls(html: string): string {
  return html.replace(RELATIVE_ASSET_ATTR_REGEX, (_m, pre, ref, post) => {
    return `${pre}/${ref}${post}`;
  });
}

export function injectMeta(html: string, pathname: string): string {
  const siteUrl = getSiteUrl();
  const meta = defaultMetaForPath(pathname, siteUrl);
  const headBlock = buildHead(meta, siteUrl);

  // Strip existing title/description/og tags from the template (we replace them)
  let cleaned = html
    .replace(TITLE_REGEX, "")
    .replace(DESC_REGEX, "")
    .replace(OG_REGEX, "");

  cleaned = absolutizeAssetUrls(cleaned);

  // Inject our SEO block right after <head>
  if (HEAD_PLACEHOLDER_REGEX.test(cleaned)) {
    cleaned = cleaned.replace(/<head>/i, `<head>\n    ${headBlock}`);
  } else {
    cleaned = `${headBlock}${cleaned}`;
  }
  return cleaned;
}

const SEO_PATHS = new Set([
  "/",
  "/library",
  "/custom-prayer",
  "/request-prayer",
  "/about",
  "/contact",
  "/legal",
  "/privacy",
  "/privacy-policy",
  "/terms",
  "/terms-of-service",
  "/cookies",
  "/cookie-policy",
  "/california-privacy",
  "/do-not-sell",
  "/gdpr",
  "/disclaimer",
  "/refunds",
  "/privacy-choices",
  "/your-privacy-choices",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/account",
  "/dashboard",
]);

export function isSeoPath(pathname: string): boolean {
  if (SEO_PATHS.has(pathname)) return true;
  if (/^\/prayer\/\d+\/?$/.test(pathname)) return true;
  if (/^\/library\/[a-z0-9-]+$/i.test(pathname)) return true;
  if (/^\/legal\/[a-z0-9-]+$/i.test(pathname)) return true;
  if (pathname.startsWith("/admin")) return true; // noindex page still served
  return false;
}

export function buildRobotsTxt(): string {
  const siteUrl = getSiteUrl();
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "Disallow: /login",
    "Disallow: /register",
    "Disallow: /forgot-password",
    "Disallow: /reset-password",
    "Disallow: /account",
    "Disallow: /dashboard",
    "Disallow: /api/",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

export function buildSitemapXml(): string {
  const siteUrl = getSiteUrl();
  const today = new Date().toISOString().slice(0, 10);
  const urls: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[] = [
    { loc: `${siteUrl}/`, lastmod: today, changefreq: "weekly", priority: "1.0" },
    { loc: `${siteUrl}/library`, lastmod: today, changefreq: "weekly", priority: "0.9" },
    { loc: `${siteUrl}/custom-prayer`, lastmod: today, changefreq: "monthly", priority: "0.8" },
    { loc: `${siteUrl}/about`, lastmod: today, changefreq: "monthly", priority: "0.5" },
    { loc: `${siteUrl}/contact`, lastmod: today, changefreq: "monthly", priority: "0.4" },
    { loc: `${siteUrl}/legal`, lastmod: today, changefreq: "yearly", priority: "0.3" },
    { loc: `${siteUrl}/legal/privacy`, lastmod: today, changefreq: "yearly", priority: "0.3" },
    { loc: `${siteUrl}/legal/terms`, lastmod: today, changefreq: "yearly", priority: "0.3" },
    { loc: `${siteUrl}/legal/cookies`, lastmod: today, changefreq: "yearly", priority: "0.3" },
    { loc: `${siteUrl}/legal/california`, lastmod: today, changefreq: "yearly", priority: "0.3" },
    { loc: `${siteUrl}/legal/gdpr`, lastmod: today, changefreq: "yearly", priority: "0.3" },
    { loc: `${siteUrl}/legal/disclaimer`, lastmod: today, changefreq: "yearly", priority: "0.3" },
    { loc: `${siteUrl}/legal/refunds`, lastmod: today, changefreq: "yearly", priority: "0.3" },
    { loc: `${siteUrl}/privacy-choices`, lastmod: today, changefreq: "yearly", priority: "0.3" },
  ];
  try {
    const rows = db.select().from(uploadedPrayers).all();
    for (const row of rows) {
      const lastmod = (row.createdAt || "").slice(0, 10) || today;
      urls.push({
        loc: `${siteUrl}/prayer/${row.id}`,
        lastmod,
        changefreq: "monthly",
        priority: "0.7",
      });
    }
  } catch {
    // If the table is unavailable we still emit static URLs.
  }

  const body = urls
    .map((u) => {
      const inner = [
        `    <loc>${escapeHtml(u.loc)}</loc>`,
        u.lastmod ? `    <lastmod>${escapeHtml(u.lastmod)}</lastmod>` : "",
        u.changefreq ? `    <changefreq>${escapeHtml(u.changefreq)}</changefreq>` : "",
        u.priority ? `    <priority>${escapeHtml(u.priority)}</priority>` : "",
      ]
        .filter(Boolean)
        .join("\n");
      return `  <url>\n${inner}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function registerSeoStaticRoutes(app: Express) {
  app.get("/robots.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buildRobotsTxt());
  });

  app.get("/sitemap.xml", (_req, res) => {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buildSitemapXml());
  });

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "holy-spirit-prayers",
      time: new Date().toISOString(),
    });
  });
}

export function readIndexHtml(distPath: string): string | null {
  const indexPath = path.resolve(distPath, "index.html");
  if (!fs.existsSync(indexPath)) return null;
  return fs.readFileSync(indexPath, "utf-8");
}
