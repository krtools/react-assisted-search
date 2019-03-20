import AssistedSearchStore from './AssistedSearchStore';
import keyHandler from '../util/keyHandler';
import {SyntheticEvent} from 'react';

/**
 * Manages user events and translates them into one or more actions performed on the store
 */
export default class UserEventDispatcher {
  private readonly store: AssistedSearchStore;

  public _handler: any;

  public handler = (e: SyntheticEvent<HTMLInputElement>) => {
    let onKeyDown = this.store.options.onKeyDown;
    if (!onKeyDown || onKeyDown(e, this.store, this) !== true) {
      return this._handler(e, this);
    }
  };

  constructor(store: AssistedSearchStore) {
    this.store = store;
    this._handler = keyHandler(() => ({
      'Ctrl+A': this.selectAll,
      // same default as non-ctrl, but allows switching through entries too
      'Ctrl+ArrowLeft': this.left,
      'Ctrl+ArrowRight': this.right,
      // 'Shift+End': this.selectToEnd,
      // 'Shift+Home': this.selectToStart,
      // 'Shift+ArrowDown': this.shiftDown,
      // 'Shift+ArrowUp': this.shiftUp,
      'Ctrl+Backspace': this.backspace,
      Backspace: this.backspace,
      Delete: this.del,
      'Ctrl+Delete': this.del,
      ArrowDown: this.down,
      End: this.end,
      Enter: this.enter,
      Escape: this.escape,
      Home: this.home,
      ArrowLeft: this.left,
      ArrowRight: this.right,
      PageDown: this.pageDown,
      PageUp: this.pageUp,
      Space: this.space,
      Tab: this.tab,
      ArrowUp: this.up,
      test: this._before
    }));
  }

  // acts on every event to update the input selection start/end for the target input
  private _before = (e: SyntheticEvent<HTMLInputElement>) => {
    // allows the store to figure out where to go next if user is using left/right/home/end etc
    if (this.store.activeElement && this._isInput(e.target)) {
      this.store.setInputSelectionFor(e.target as HTMLInputElement);
      return true;
    }
  };

  /** Delegates the "home" key function to the store */
  home = (e: SyntheticEvent<HTMLInputElement>) => {
    if (this.store.moveToHome()) {
      e.preventDefault();
    }
  };

  /** Delegates the "end" key function to the store */
  end = (e: SyntheticEvent<HTMLInputElement>) => {
    if (this.store.moveToEnd()) {
      e.preventDefault();
    }
  };

  // /**
  //  * If text cursor != 0, do default behavior
  //  * If text cursor = 0, select to first entry
  //  * Else do nothing
  //  * @param {SyntheticEvent<HTMLInputElement>} e
  //  */
  // selectToStart = (e: SyntheticEvent<HTMLInputElement>) => {
  // };

  // /**
  //  * If text cursor = end, select to last entry
  //  * @param {SyntheticEvent<HTMLInputElement>} e
  //  */
  // selectToEnd = (e: SyntheticEvent<HTMLInputElement>) => {};

  /**
   * If not all text selected, select all text.
   * If all text selected, select all entries.
   * @param {SyntheticEvent<HTMLInputElement>} e
   */
  selectAll = (e: SyntheticEvent<HTMLInputElement>) => {
    let target = e.target as HTMLInputElement;
    let entry = this.store.getActiveEntry();
    // if no custom values we don't select the input, we just select all entries
    let locked = entry && !this.store.customValues(entry.entry.facet);
    if (
      locked ||
      (this._isInput(target) && target.selectionStart === 0 && target.selectionEnd === target.value.length)
    ) {
      this.store.selectEntries(this.store.entries.slice());
      e.preventDefault();
    }
  };

  /** move up a page (of dropdown items) */
  pageUp = (e: SyntheticEvent<HTMLInputElement>) => {
    // TODO: only works right if all dropdown options have the same height, revisit
    let height = _getHeights(e.currentTarget);
    if (height) {
      this.store.selectPrevItem(Math.floor(height.dropdownHeight / height.itemHeight));
    }
  };

  /** move down a page (of dropdown items) */
  pageDown = (e: SyntheticEvent<HTMLInputElement>) => {
    // TODO: only works right if all dropdown options have the same height, revisit
    let height = _getHeights(e.currentTarget);
    if (height) {
      this.store.selectNextItem(Math.floor(height.dropdownHeight / height.itemHeight));
    }
  };

  /** move down (dropdown item) */
  up = (e: SyntheticEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.store.selectPrevItem();
  };

  /** move down (dropdown item) */
  down = (e: SyntheticEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.store.selectNextItem();
  };

  /**
   * Moves to the left.
   *
   * @param {SyntheticEvent<HTMLInputElement>} e
   */
  left = (e: SyntheticEvent<HTMLInputElement>) => {
    if (this.store.moveLeft()) {
      e.preventDefault();
    }
  };

  /** move to the right (text|entry) */
  right = (e: SyntheticEvent<HTMLInputElement>) => {
    if (this.store.moveRight()) {
      e.preventDefault();
    }
  };

  /**
   * Select or commit the current value to the input.
   *
   * We will do the default browser behavior (lose focus) if no value is selected in the dropdown and no value is in
   * the input.
   *
   * @param e
   */
  tab = (e: SyntheticEvent<HTMLInputElement>) => {
    let store = this.store;
    if (store.hasSelectedItems() || (store.activeElement && store.activeElement.value)) {
      store.setSelection(store.isSingle(), false);
      e.preventDefault();
    }
  };

  /**
   * Leave the current context
   * Will deselect the selected items, or remove the dropdown
   * @param {SyntheticEvent<HTMLInputElement>} e
   */
  escape = (e: SyntheticEvent<HTMLInputElement>) => {
    if (this.store.hasSelectedItems()) {
      this.store.setSelectedItems([]);
    } else {
      this.store.clearDropdown();
    }
  };

  /** An override to enter, if in faceted mode, will accept value as an faceted value */
  enter = (e: SyntheticEvent<HTMLInputElement>) => {
    if (this._isInput(e.target as Element)) {
      this.store.setSelection(true, true);
      e.preventDefault();
    }
  };

  /**
   * "Windows" Delete
   * If cursor != end, delete characaters
   * If cursor = end and in entry input, delete next entry
   * If cursor = end and in main input, do nothing
   */
  del = (): void => {
    this.store.deleteAhead();
  };

  /**
   * If cursor != 0, or text selected, delete characters
   * If cursor = 0 and no text selected, delete entry behind us
   * If no entry behind us, do nothing
   */
  backspace = (e: SyntheticEvent<HTMLInputElement>) => {
    if (this.store.deleteBehind()) {
      e.preventDefault();
    }
  };

  /**
   * Is true if the target is a valid input generated for react-assisted-search
   * @private
   */
  private _isInput(target: EventTarget) {
    return (
      (target as Element).classList.contains('assisted-search-input') ||
      (target as Element).classList.contains('assisted-search-entry-value')
    );
  }

  /**
   * Toggle the selected status of the highlighted item in the dropdown
   */
  space(): void {}
}

// TODO: this is super hacky, should (A) examine each items height, (B) not use dom selection
function _getHeights(el: HTMLElement): {dropdownHeight: number; itemHeight: number} | null {
  let e = el.closest('.assisted-search');
  if (!e) {
    return null;
  }
  let dd = el.querySelector('.assisted-search-base-dropdown');
  if (!dd) {
    return null;
  }
  let item = dd.querySelector('.assisted-search-dropdown-item');
  if (!item) {
    return null;
  }
  return {
    dropdownHeight: dd.getBoundingClientRect().height,
    itemHeight: item.getBoundingClientRect().height
  };
}
