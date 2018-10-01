/**
 * Positions a dropdown or other related menu item so that there is enough screen space to view it. If there is never
 * enough screen space, the height is reduced.
 *
 * @param {HTMLElement} el the absolute-positioned element to position to top or bottom
 * @param {string} flipClass the class to apply when the dropdown needs to be flipped to a drop-up
 * @param {number} bottomOffset the window's bottom offset, to account for footers or other fixed elements
 * @param {number} topOffset the window's top offset to account for headers or other fixed elements
 */
export default function autoPosition(el: Element, flipClass: string, bottomOffset: number = 0, topOffset: number = 0) {
  let clsList = el.classList;
  clsList.remove(flipClass);
  let r = el.getBoundingClientRect();

  let wHeight = window.innerHeight - bottomOffset;
  let top = r.top - topOffset;
  let bottom = r.bottom - bottomOffset;

  if (bottom > wHeight && top > wHeight - bottom) {
    clsList.add(flipClass);
  } else {
    clsList.remove(flipClass);
  }
}
