/**
 * Simple direct parent function to scroll a node into view for its direct parent
 * @param {HTMLElement} el
 */
export function scrollIfNeeded(el: HTMLElement): void {
  let parent = el.parentElement;

  let pHeight = parent.offsetHeight;
  let pScroll = parent.scrollTop;

  let eHeight = el.offsetHeight;
  let eOffsetTop = el.offsetTop;

  if (eOffsetTop < pScroll) {
    // need to scroll up
    parent.scrollTop = eOffsetTop - 1;
  } else if (eOffsetTop + eHeight > pScroll + pHeight) {
    // need to scroll down
    parent.scrollTop = eOffsetTop - pHeight + eHeight + 1;
  }
}
