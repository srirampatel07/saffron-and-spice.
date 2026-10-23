/**
 * Reads the build-time menu snapshot. It is stored as a non-executable JSON
 * data block so the production CSP does not need to allow inline scripts.
 */
export function readInitialMenu() {
  if (typeof document !== 'undefined') {
    const element = document.getElementById('initial-menu');
    if (element) {
      try {
        const parsed = JSON.parse(element.textContent || '');
        if (parsed && Array.isArray(parsed.items)) return parsed;
      } catch {
        // Fall through to the legacy window global or a live API fetch.
      }
    }
  }

  if (typeof window !== 'undefined') {
    const globalMenu = window.__INITIAL_MENU__;
    if (globalMenu && Array.isArray(globalMenu.items)) return globalMenu;
  }

  return null;
}
