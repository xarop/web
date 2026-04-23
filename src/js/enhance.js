/**
 * xarop.com — Progressive enhancements
 *
 * Res aquí és necessari. Tot funciona sense JavaScript.
 *
 * - Selector de sabor (amb persistència a localStorage)
 * - Selector de tema (switch clar/fosc)
 * - Any actualitzat al footer
 * - View Transitions entre pàgines (si el navegador les suporta)
 *
 * Per desactivar: elimina la referència a aquest script al <head>.
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
    } else {
      delete html.dataset.theme;
    }
  } catch (_) { /* quota, private mode, etc */ }

  // ---- 2. Activar el flavor picker ----
  const picker = document.querySelector(".flavor-picker");
  if (picker) {
    picker.dataset.enabled = "true";
    const current = html.dataset.flavor || "maduixa";

    picker.querySelectorAll("button[data-flavor]").forEach(btn => {
      btn.setAttribute("aria-pressed", btn.dataset.flavor === current ? "true" : "false");
      btn.addEventListener("click", () => {
        const flavor = btn.dataset.flavor;

        // View Transition API si està disponible
        const apply = () => {
          html.dataset.flavor = flavor;
          try { localStorage.setItem(FLAVOR_KEY, flavor); } catch (_) { }
          picker.querySelectorAll("button[data-flavor]").forEach(b => {
            b.setAttribute("aria-pressed", b.dataset.flavor === flavor ? "true" : "false");
          });
        };

        if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
          document.startViewTransition(apply);
        } else {
          apply();
        }
      });
    });
  }

  // ---- 3. Activar el theme toggle ----
  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.dataset.enabled = "true";

    const getCurrentTheme = () => {
      if (html.dataset.theme === "light" || html.dataset.theme === "dark") {
        return html.dataset.theme;
      }
      return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const syncThemeToggle = () => {
      const isDark = getCurrentTheme() === "dark";
      themeToggle.setAttribute("aria-checked", isDark ? "true" : "false");
      themeToggle.dataset.themePreference = isDark ? "dark" : "light";
      themeToggle.title = isDark ? "fosc" : "clar";
      themeToggle.setAttribute("aria-label", isDark ? "Tema fosc activat" : "Tema clar activat");
    };

    syncThemeToggle();

    themeToggle.addEventListener("click", () => {
      const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";

      const apply = () => {
        html.dataset.theme = nextTheme;
        try { localStorage.setItem(THEME_KEY, nextTheme); } catch (_) { }
        syncThemeToggle();
      };

      if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.startViewTransition(apply);
      } else {
        apply();
      }
    });
  }

  // ---- 4. Any actual al footer ----
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
