import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Bootstrap routing for real-path entries (e.g. crawler hits /prayer/123 or
// a Railway link to /library). The SPA uses wouter's hash router internally,
// so we translate any non-trivial pathname into the matching hash route.
(() => {
  const { pathname, search, hash } = window.location;
  if (hash && hash.startsWith("#/")) return;
  if (pathname && pathname !== "/" && pathname !== "/index.html") {
    const target = `#${pathname}${search || ""}`;
    window.history.replaceState(
      null,
      "",
      `/${hash ? "" : ""}${target}`,
    );
    return;
  }
  if (!hash) {
    window.location.hash = "#/";
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
