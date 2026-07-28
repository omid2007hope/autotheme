/**
 * AutoTheme DOM Adapter.
 * Handles adding/removing CSS classes on DOM elements.
 * Used by the observer for class-based themes (Tailwind, Bootstrap).
 *
 * @module adapters/dom
 */

/**
 * Remove the previous classes and add the next classes on a DOM element.
 * Splits class strings by whitespace. Handles empty/null strings safely.
 *
 * @param {HTMLElement} el - Target DOM element
 * @param {string} previousClasses - Space-separated class string to remove
 * @param {string} nextClasses - Space-separated class string to add
 */
export function applyClasses(el, previousClasses, nextClasses) {
  if (previousClasses) {
    const toRemove = previousClasses.split(/\s+/).filter(Boolean);
    if (toRemove.length > 0) {
      el.classList.remove(...toRemove);
    }
  }

  if (nextClasses) {
    const toAdd = nextClasses.split(/\s+/).filter(Boolean);
    if (toAdd.length > 0) {
      el.classList.add(...toAdd);
    }
  }
}
