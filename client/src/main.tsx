import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Bootstrap routing for real-path entries (e.g. crawler hits /prayer/123 or
// a Railway link to /library). The SPA uses wouter's hash router internally,
// so we translate any non-trivial pathname into the matching hash route.
//
// Wrapped in try/catch so a routing edge case (e.g. about:blank previews,
// sandboxed iframes that block history APIs) can never prevent React from
// mounting and producing a blank page.
try {
  const { pathname, search, hash } = window.location;
  const hasHashRoute = hash && hash.startsWith("#/");
  const isStaticIndex =
    !pathname ||
    pathname === "/" ||
    /(^|\/)index\.html$/i.test(pathname);

  if (!hasHashRoute) {
    if (!isStaticIndex) {
      // Real path like /library or /prayer/123 — fold into the hash router
      // without changing the pathname (so a refresh still hits the same SEO
      // page on the server). Using location.hash keeps both pathname and the
      // existing search string intact.
      window.location.hash = `#${pathname}${search || ""}`;
    } else {
      window.location.hash = "#/";
    }
  }
} catch {
  // Ignore — fall through to render. The app's default route still renders.
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
