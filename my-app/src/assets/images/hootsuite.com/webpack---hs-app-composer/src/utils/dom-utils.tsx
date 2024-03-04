const getDimensions = elem => {
  const isWindow = obj => obj && typeof obj === 'object' && 'setInterval' in obj
  if (isWindow(elem)) {
    return {
      height: window.innerHeight,
      width: window.innerWidth,
      scrollTop: window.pageYOffset,
      scrollLeft: window.pageXOffset,
      offset: {
        top: 0,
        left: 0,
      },
    }
  }
  const rect = elem.getBoundingClientRect()
  return {
    height: rect.height,
    width: rect.width,
    scrollLeft: elem.scrollLeft,
    scrollTop: elem.scrollTop,
    offset: {
      top: rect.top,
      left: rect.left,
    },
  }
}

/**
 * Polyfill for Element.closest(). Taken from https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
 * This method returns the closest ancestor of the current element (or the current element itself)
 * which matches the selectors given in parameter. If there isn't such an ancestor, it returns null.
 * @param {HTMLElement} elem A DOM element within which a matching element may be found
 * @param {string} selector A string containing a selector expression to match elements against
 * @returns {HTMLElement}
 */
const closest = function (elem, selector) {
  const matches = (elem.document || elem.ownerDocument).querySelectorAll(selector)
  let i
  let el = elem
  do {
    i = matches.length
    while (--i >= 0 && matches.item(i) !== el) {} // eslint-disable-line no-empty
  } while (i < 0 && (el = el.parentElement))
  return el
}

export { getDimensions, closest }
