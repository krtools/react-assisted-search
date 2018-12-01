import AssistedSearchStore from '../stores/AssistedSearchStore';

/**
 * An action triggers an update to the store after the function (and any nested actions) have completed.
 *
 * @param target
 * @param propertyKey
 * @param descriptor
 */
export function action(target: AssistedSearchStore, propertyKey: string, descriptor?: PropertyDescriptor): any {
  if (!descriptor) {
    return actionProperty(target, propertyKey, false);
  }
  return actionMethod(target, descriptor, false);
}

/**
 * A dropdownAction triggers an update to the store, and triggers the dropdown to be updated based the current value of
 * the active input.
 *
 * @param target
 * @param propertyKey
 * @param descriptor
 */
export function dropdownAction(target: AssistedSearchStore, propertyKey: string, descriptor?: PropertyDescriptor): any {
  if (!descriptor) {
    return actionProperty(target, propertyKey, true);
  }
  return actionMethod(target, descriptor, true);
}

export function actionMethod(target: AssistedSearchStore, descriptor: PropertyDescriptor, dropdown: boolean) {
  let method = descriptor.value;
  descriptor.value = function() {
    let args = arguments;
    return target.runInAction.call(this, () => method.apply(this, args), dropdown);
  };
}

export function actionProperty(target: AssistedSearchStore, propertyKey: string, dropdown?: boolean) {
  Object.defineProperty(target, propertyKey, {
    configurable: true,
    enumerable: false,
    get() {
      return undefined;
    },
    set(value) {
      Object.defineProperty(this, propertyKey, {
        value: function(...args) {
          (this as AssistedSearchStore).runInAction(() => {
            value.apply(this, args);
          }, dropdown);
        },
        enumerable: false,
        writable: true,
        configurable: true
      });
    }
  });
}
