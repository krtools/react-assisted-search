/**
 * Set the selection range for an input, -1 implies to end of input
 * @param el
 * @param start
 * @param end
 */
export default function setSelection(el: HTMLInputElement, start: number, end: number) {
  el.selectionStart = start === -1 ? el.value.length : start;
  el.selectionEnd = end === -1 ? el.value.length : end;
}
