/**
 * xarop.com — Progressive enhancements
 *
 * - Selector de sabor al header
 * - Selector de tema (sol/lluna)
 * - Links de tema linkables via ?theme=
 * - Selector d'idioma (links estàtics generats al build)
 * - Any actualitzat al footer
 * - View Transitions entre pàgines
 */

(() => {
  const html = document.documentElement;
  const FLAVOR_KEY = "xarop:flavor";
  const THEME_KEY = "xarop:theme";

  // ---- 1. Restaurar preferències ----
  try {
    const savedFlavor = localStorage.getItem(FLAVOR_KEY);
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedFlavor) html.dataset.flavor = savedFlavor;

    if (savedTheme === "light" || savedTheme === "dark") {
      html.dataset.theme = savedTheme;
    }
    // Sense preferència guardada: el CSS gestiona prefers-color-scheme automàticament
  } catch (_) { }

  // ---- 2. URL params (?theme=dark|light) ----
  try {
    const params = new URLSearchParams(location.search);
    const themeParam = params.get("theme");
    if (themeParam === "dark" || themeParam === "light") {
      html.dataset.theme = themeParam;
      try { localStorage.setItem(THEME_KEY, themeParam); } catch (_) { }
      const cleanUrl = new URL(location.href);
      cleanUrl.searchParams.delete("theme");
      history.replaceState(null, "", cleanUrl);
    }
  } catch (_) { }

  // ---- 3. View Transitions helper ----
  const withViewTransition = (fn) => {
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.startViewTransition(fn);
    } else {
      fn();
    }
  };

  // ---- 4. Helpers de tema ----
  const getCurrentTheme = () => {
    if (html.dataset.theme === "light" || html.dataset.theme === "dark") return html.dataset.theme;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const themeToggle = document.querySelector(".theme-toggle");

  const syncThemeToggle = () => {
    if (!themeToggle) return;
    const isDark = getCurrentTheme() === "dark";
    themeToggle.setAttribute("aria-checked", isDark ? "true" : "false");
    themeToggle.dataset.themePreference = isDark ? "dark" : "light";
    themeToggle.title = isDark ? "tema fosc — clic per aclarir" : "tema clar — clic per enfosquir";
    themeToggle.setAttribute("aria-label", isDark ? "Tema fosc activat" : "Tema clar activat");
  };

  const sendGiscusTheme = (theme) => {
    const iframe = document.querySelector("iframe.giscus-frame");
    if (!iframe) return;
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme } } },
      "https://giscus.app"
    );
  };

  const applyTheme = (theme) => {
    withViewTransition(() => {
      html.dataset.theme = theme;
      try { localStorage.setItem(THEME_KEY, theme); } catch (_) { }
      syncThemeToggle();
      sendGiscusTheme(theme);
    });
  };

  // Quan giscus carrega, sincronitzar el tema actual del lloc
  window.addEventListener("message", (e) => {
    if (e.origin !== "https://giscus.app") return;
    if (e.data?.giscus) sendGiscusTheme(getCurrentTheme());
  });

  // ---- 4. Activar el flavor picker ----
  const picker = document.querySelector(".flavor-picker");
  if (picker) {
    picker.dataset.enabled = "true";

    const applyFlavor = (flavor) => {
      withViewTransition(() => {
        html.dataset.flavor = flavor;
        try { localStorage.setItem(FLAVOR_KEY, flavor); } catch (_) { }
        document.querySelectorAll("button[data-flavor]").forEach(b => {
          b.setAttribute("aria-pressed", b.dataset.flavor === flavor ? "true" : "false");
        });
      });
    };

    const current = html.dataset.flavor || "maduixa";
    document.querySelectorAll("button[data-flavor]").forEach(btn => {
      btn.setAttribute("aria-pressed", btn.dataset.flavor === current ? "true" : "false");
      btn.addEventListener("click", () => applyFlavor(btn.dataset.flavor));
    });
  }

  // ---- 5. Activar el theme toggle ----
  if (themeToggle) {
    themeToggle.dataset.enabled = "true";
    syncThemeToggle();
    themeToggle.addEventListener("click", () => {
      applyTheme(getCurrentTheme() === "dark" ? "light" : "dark");
    });
  }

  // ---- 6. Links de tema (footer i altres) ----
  document.querySelectorAll("a[data-set-theme]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      applyTheme(link.dataset.setTheme);
    });
  });

  // ---- 7. Lang picker: habilita l'expansió al hover ----
  const langPickerWrap = document.querySelector(".lang-picker-wrap");
  if (langPickerWrap) {
    const langPickerEl = langPickerWrap.querySelector(".lang-picker");
    if (langPickerEl) langPickerEl.dataset.enabled = "true";
  }

  // ---- 8. Any actual al footer ----
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
