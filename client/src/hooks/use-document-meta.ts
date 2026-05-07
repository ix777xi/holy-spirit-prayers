import { useEffect } from "react";

type DocumentMetaInput = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  noindex?: boolean;
};

function upsertMeta(name: string, content: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${name}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  if (!href) return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function resolveSiteUrl(): string {
  if (typeof window === "undefined") return "";
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="x-site-url"]',
  );
  if (meta?.content) return meta.content.replace(/\/+$/, "");
  return `${window.location.protocol}//${window.location.host}`;
}

export function useDocumentMeta(input: DocumentMetaInput) {
  const { title, description, canonicalPath, noindex } = input;
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (title) document.title = title;
    if (description) {
      upsertMeta("description", description);
      upsertMeta("og:description", description, "property");
      upsertMeta("twitter:description", description);
    }
    if (title) {
      upsertMeta("og:title", title, "property");
      upsertMeta("twitter:title", title);
    }
    if (canonicalPath) {
      const siteUrl = resolveSiteUrl();
      const path = canonicalPath.startsWith("/")
        ? canonicalPath
        : `/${canonicalPath}`;
      upsertCanonical(`${siteUrl}${path}`);
      upsertMeta("og:url", `${siteUrl}${path}`, "property");
    }
    upsertMeta("robots", noindex ? "noindex, nofollow" : "index, follow");
  }, [title, description, canonicalPath, noindex]);
}
