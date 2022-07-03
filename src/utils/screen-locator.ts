// Get element offset relatively to the document
// src : https://stackoverflow.com/a/46155596
export const getElementOffset = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();

  // add window scroll position to get the offset position
  const left = rect.left + window.scrollX;
  const top = rect.top + window.scrollY;
  const right = rect.right + window.scrollX;
  const bottom = rect.bottom + window.scrollY;

  // polyfill missing 'x' and 'y' rect properties not returned
  // from getBoundingClientRect() by older browsers

  const x = rect.x === undefined ? left : rect.x + window.screenX;
  const y = rect.y === undefined ? top : rect.y + window.screenY;

  return { left, top, right, bottom, x, y, width: rect.width, height: rect.height };
};

// Locate an element in DOM and move the element to that DOM
// Element are located in the screen base their Id tags
export const screenLocator = (id: string) => {
  const el = document.getElementById(id);

  if (!el) return null;

  return getElementOffset(el);
};

// Element that are going to be move/located are accessed by their Id
export const moveElement = (srcEl: HTMLElement, dest: HTMLElement) => {
  const offset = getElementOffset(dest);

  srcEl.style.left = `${offset.left}px`;
  srcEl.style.top = `${offset.top}px`;
};
