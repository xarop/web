/**
 * xarop.com — Progressive enhancements
 *
 * Res aquí és necessari. Tot funciona sense JavaScript.
 *
 * - Selector de sabor (amb persistència a localStorage)
 * - Any actualitzat al footer
 * - View Transitions entre pàgines (si el navegador les suporta)
 *
 * Per desactivar: elimina la referència a aquest script al <head>.
 */

(() => {
  const html = document.documentElement;
  const STORAGE_KEY = "xarop:flavor";

  // ---- 1. Restaurar sabor preferit ----
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) html.dataset.flavor = saved;
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
          try { localStorage.setItem(STORAGE_KEY, flavor); } catch (_) {}
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

  // ---- 3. Any actual al footer ----
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
