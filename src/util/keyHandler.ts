// Event.key is not consistent cross-browser
import {SyntheticEvent} from 'react';

const KEYS = {
  8: 'Backspace',
  9: 'Tab',
  13: 'Enter',
  27: 'Escape',
  32: 'Space',
  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  46: 'Delete',
  186: ':',
  187: '=',
  188: '<',
  189: '-',
  190: '>',
} as {
  [key: number] : string
};

export type GetKeyHandlerMap = () => {
  test?: (e: SyntheticEvent<HTMLInputElement>) => void;
  [key: string]: (e: SyntheticEvent<HTMLInputElement>) => void;
};

/**
 * Generate a key handling function based on map of key names (or a function that returns
 * a map of key names)
 *
 * @param {Function.<object.<string, Function>>} getMap
 * @param [after] a function to invoke after the event has been dispatched (only fires if there was something to dispatch)
 * @returns {function(Event)}
 */
export default function keyHandler(getMap: GetKeyHandlerMap, after?: Function) {
  /** @param {KeyboardEvent} e */
  return function(e: any) {
    let map = getMap();

    let test = map.test;
    if (test && !test.apply(this, arguments)) {
      return;
    }
    let keys = [];
    if (e.ctrlKey) {
      keys.push('Ctrl');
    }
    if (e.altKey) {
      keys.push('Alt');
    }
    if (e.shiftKey) {
      keys.push('Shift');
    }
    let which = e.which & ~32;
    if (which >= 65 && which <= 90) {
      keys.push(String.fromCharCode(which));
    } else if (e.which >= 49 && e.which <= 58) {
      keys.push(String.fromCharCode(e.which));
    } else if (KEYS.hasOwnProperty(e.which)) {
      keys.push(KEYS[e.which]);
    }

    let fn: Function;
    if (!keys.length && map.other) {
      fn = map.other;
    } else {
      fn = map[keys.join('+')] || map.other;
    }

    if (fn) {
      let retVal = fn.apply(this, arguments);
      if (after) {
        after();
      }
      return retVal;
    }
  };
}
