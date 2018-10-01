/**
 * Convenience to dispatch events to an array of functions with the same arguments
 *
 * @param functions
 * @param args
 * @param ignoreErrors
 */
export function invokeAll(functions: Function[], args: any[], ignoreErrors = true) {
  if (Array.isArray(functions)) {
    for (let i = 0; i < functions.length; i++) {
      let fn = functions[i];
      if (typeof fn === 'function') {
        try {
          fn(...args);
        } catch (e) {
          if (!ignoreErrors) {
            throw e;
          }
        }
      }
    }
  }
}

/**
 *
 * @param getFunction
 */
export function delegate(getFunction: () => any) : any {
  return function() {
    let fn = getFunction();
    if (fn) {
      fn.apply(this, arguments);
    }
  };
}
