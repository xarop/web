/**
 * xarop.com — Progressive enhancements
 *
 * - Selector de sabor al header (punt que s'expandeix al hover)
 * - Selector de tema (sol/lluna SVG al header)
 * - Links de tema al footer (tema fosc / tema clar), linkables via ?theme=
 * - Noms de sabor al home clicables
 * - Selector d'idioma estil tauler d'aeroport + Google Translate
 * - Any actualitzat al footer
 * - View Transitions entre pàgines (si el navegador les suporta)
 */

(() => {
  const html = document.documentElement;
  const FLAVOR_KEY = "xarop:flavor";
  const THEME_KEY = "xarop:theme";
  const LANG_KEY = "xarop:lang";

  // ---- 1. Restaurar preferències ----
  try {
    const savedFlavor = localStorage.getItem(FLAVOR_KEY);
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedFlavor) html.dataset.flavor = savedFlavor;

    if (savedTheme === "light" || savedTheme === "dark") {
      html.dataset.theme = savedTheme;
    } else {
      html.dataset.theme = "light";
    }
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

  // ---- 3. Helpers de tema ----
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
    const apply = () => {
      html.dataset.theme = theme;
      try { localStorage.setItem(THEME_KEY, theme); } catch (_) { }
      syncThemeToggle();
      sendGiscusTheme(theme);
    };
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
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
      const apply = () => {
        html.dataset.flavor = flavor;
        try { localStorage.setItem(FLAVOR_KEY, flavor); } catch (_) { }
        document.querySelectorAll("button[data-flavor]").forEach(b => {
          b.setAttribute("aria-pressed", b.dataset.flavor === flavor ? "true" : "false");
        });
      };
      if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.startViewTransition(apply);
      } else {
        apply();
      }
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

  // ---- 7. Selector d'idioma (s'expandeix al hover) ----
  const langPickerWrap = document.querySelector(".lang-picker-wrap");
  const langTrigger = document.querySelector(".lang-trigger");
  const langPickerEl = document.querySelector(".lang-picker");

  if (langPickerWrap && langTrigger && langPickerEl) {
    const LANGS = ["CA", "ES", "EN", "SV", "IT"];
    const LANG_CODES = { CA: "ca", ES: "es", EN: "en", SV: "sv", IT: "it" };

    const getCookieLang = () => {
      const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
      if (!m) return "ca";
      const parts = decodeURIComponent(m[1]).split("/");
      return parts[2] || "ca";
    };

    const setLangUrl = (langCode) => {
      try {
        const url = new URL(location.href);
        if (langCode === "ca") {
          url.searchParams.delete("lang");
        } else {
          url.searchParams.set("lang", langCode);
        }
        history.replaceState(null, "", url);
      } catch (_) { }
    };

    // Determinar idioma inicial: localStorage > CA
    let currentLang = "CA";
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && LANGS.includes(saved)) currentLang = saved;
    } catch (_) { }

    // URL param ?lang=XX té prioritat (per a enllaços compartits)
    try {
      const p = new URLSearchParams(location.search).get("lang");
      if (p && LANGS.includes(p.toUpperCase())) {
        const fromUrl = p.toUpperCase();
        currentLang = fromUrl;
        try { localStorage.setItem(LANG_KEY, fromUrl); } catch (_) { }
        // Si la cookie no coincideix, establir-la i recarregar (una sola vegada)
        if (fromUrl !== "CA" && getCookieLang() !== LANG_CODES[fromUrl]) {
          const val = `/ca/${LANG_CODES[fromUrl]}`;
          document.cookie = `googtrans=${val}; path=/`;
          document.cookie = `googtrans=${val}; path=/; domain=.${location.hostname}`;
          location.reload();
        }
      }
    } catch (_) { }

    langPickerEl.dataset.enabled = "true";
    langPickerWrap.dataset.enabled = "true";
    langTrigger.textContent = currentLang;

    const applyTranslation = (langCode) => {
      const past = "Thu, 01 Jan 1970 00:00:00 GMT";
      if (langCode === "ca") {
        document.cookie = `googtrans=; path=/; expires=${past}`;
        document.cookie = `googtrans=; path=/; domain=.${location.hostname}; expires=${past}`;
        setLangUrl("ca");
        location.reload();
      } else {
        const val = `/ca/${langCode}`;
        document.cookie = `googtrans=${val}; path=/`;
        document.cookie = `googtrans=${val}; path=/; domain=.${location.hostname}`;
        setLangUrl(langCode);
        const gtSelect = document.querySelector(".goog-te-combo");
        if (gtSelect) {
          gtSelect.value = langCode;
          gtSelect.dispatchEvent(new Event("change"));
        } else {
          location.reload();
        }
      }
    };

    const syncLangButtons = (lang) => {
      langPickerEl.querySelectorAll(".lang-btn[data-lang]").forEach(btn => {
        btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
      });
    };

    syncLangButtons(currentLang);

    langPickerEl.querySelectorAll(".lang-btn[data-lang]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (langTrigger.classList.contains("is-flipping")) return;
        const nextLang = btn.dataset.lang;
        if (nextLang === currentLang) return;

        langTrigger.classList.add("is-flipping");
        langTrigger.addEventListener("animationend", () => {
          langTrigger.textContent = nextLang;
          langTrigger.classList.remove("is-flipping");
          currentLang = nextLang;
          try { localStorage.setItem(LANG_KEY, nextLang); } catch (_) { }
          syncLangButtons(nextLang);
          applyTranslation(LANG_CODES[nextLang]);
        }, { once: true });
      });
    });
  }

  // ---- 8. Any actual al footer ----
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
