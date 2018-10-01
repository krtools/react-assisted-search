import {range} from 'lodash';

/**
 * A simple class to track a list of selected items in a list. Requires number-based indexes. Includes methods
 * to select, deselect, select ranges (e.g. shift+click), toggle (e.g. ctrl+click), and go up and down the list (e.g.
 * arrow keys).
 *
 * Additionally supports a switch between multi and single-selection mode.
 */
export default class ItemSelector {
  /** @private */
  _multi: boolean = true;

  /**
   * Maintains the last value that manipulated
   */
  _last: number = 0;

  /**
   * The selection anchor point, this differs from this._last because when you are re-selecting a range, the anchor
   * point for changing a range is based on the last single-selected item (incl toggle selections)
   * @type {number}
   * @private
   */
  _cursor: number = 0;

  _items: Set<number> = new Set();

  /**
   * If true, methods will allow selection of more than one at a time
   * @returns {boolean}
   */
  isMulti(): boolean {
    return this._multi;
  }

  /**
   * Set the multi-select option. If changed to false the cursor will be the new singly selected item.cmd
   * @param {boolean} multi
   */
  setMultiSelect = multi => {
    this._multi = multi === true;
    if (!multi) {
      let cursor = this._cursor;
      this._items.clear();
      this.selectOnly(cursor);
    }
  };

  /**
   * Just click selection, sets i as the only selected item.
   * @param {number} i
   */
  selectOnly(i: number): void {
    this._last = this._cursor = i;
    this._items.clear();
    this._items.add(i);
  }

  /**
   * Select the next item
   * NOTE: Clients are required to decide whether or not this is possible given their data set.
   * @param {boolean} [isRange] if true, will do a "Shift+Down" selection, including the current value(s) in a range.
   * @param {number} [size] the size of the list, defaults to infinity.
   * @param {boolean} [silent] if falsey, will perform the selection.
   * @param {number} [offset] how far to go (defaults to 1).
   */
  selectNext = (isRange?: boolean, size: number = Infinity, silent?: boolean, offset: number = 1) => {
    if (size === 1) {
      this.selectOnly(0);
    }
    let max = size - 1;
    if (this._cursor >= max) {
      return;
    }
    let newCursor = Math.min(max, this._cursor + offset);
    if (!this._multi) {
      return this.selectOnly(newCursor);
    }
    this._cursor = newCursor;
    if (isRange || !silent) {
      this.selectAtCursor(isRange, silent);
    }
  };

  /**
   * Perform a selection at the cursor position
   *
   * @param {boolean} isRange if true, will select from the last selection to the cursor
   * @param toggle if true will perform a toggle selection of the current cursor value, not resetting the other
   *     selections.
   */
  selectAtCursor = (isRange: boolean, toggle?: boolean) => {
    if (!this._multi) {
      return this.selectOnly(this._cursor);
    }
    if (isRange) {
      if (toggle) {
        this.selectToggleRange(this._cursor);
      } else {
        this.selectRange(this._cursor);
      }
    } else {
      if (toggle) {
        this.selectToggle(this._cursor);
      } else {
        this.selectOnly((this._last = this._cursor));
      }
    }
  };

  /**
   * Select the previous value, if possible
   * @param {boolean} [isRange] if true, will do a "Shift+Up" selection, including the previous value(s) in a range.
   * @param {boolean} [silent] if true, will update the cursor without performing a selection (but only if range is
   *     false)
   * @param {number} [offset] how far to go, defaults to 1
   */
  selectPrevious = (isRange: boolean = false, silent?: boolean, offset: number = 1) => {
    if (this._cursor === 0) {
      if (!silent) {
        this.selectOnly(0); // will select if not already
      }
      return;
    }
    let newCursor = Math.max(0, this._cursor - offset);
    if (!this._multi) {
      return this.selectOnly(newCursor);
    }
    this._cursor = newCursor;
    if (isRange || !silent) {
      this.selectAtCursor(isRange, silent);
    }
  };

  /**
   * Shift+Click selection, sets a range from i to the last selected item.
   * @param {number} i
   * @param {number} [last] resets 'last selected', useful for setting a range programmatically.
   * @param {boolean|null} [add] whether or not to only add values. This means that the range does NOT get reset
   */
  selectRange = (i: number, last: number = this._last, add: null | boolean = null) => {
    if (!this._multi) {
      return this.selectOnly(i);
    }
    this._cursor = i;
    let min = Math.min(i, last);
    // +1 for inclusive
    let max = Math.max(i, last) + 1;
    if (add === null) {
      this._items = new Set(range(min, max));
    } else {
      for (let j = min; j < max; j++) {
        if (add === true) {
          this._items.add(j);
        } else if (add === false) {
          this._items.delete(j);
        }
      }
    }
  };

  /**
   * Ctrl+Click selection, toggle selection of a single item.
   * @param {number} i
   */
  selectToggle = (i: number) => {
    if (!this._multi) {
      this._items.clear();
    }
    this._last = this._cursor = i;
    if (this._items.has(i)) {
      this._items.delete(i);
    } else {
      this._items.add(i);
    }
  };

  /**
   * Ctrl+Shift+Click selection
   * @param {number} i
   */
  selectToggleRange = (i: number) => {
    if (!this._multi) {
      this._items.clear();
      return this.selectOnly(i);
    }
    // do nothing when nothing currently selected
    if (!this._items.size) {
      return;
    }
    this.selectRange(i, this._last, this._items.has(this._last));
    // does not change always selected, only adds
    // TODO
    return i;
  };

  /**
   * Returns true if item i is selected
   * @param {number} i
   * @returns {boolean}
   */
  isSelected(i: number) {
    return this._items.has(i);
  }

  /**
   * Returns true if the item index is the "cursor" item.
   * @param i
   * @returns {boolean}
   */
  isCursor(i: number) {
    return this._cursor === i;
  }

  /**
   * Set the cursor to a specific index (not validated)
   * @param {number} i
   * @param {boolean} [isRange] if true, selects a range from the last cursor position
   * @param {boolean} [sly] if true, only moves the cursor, but does not select anything
   */
  moveCursor(i: number, isRange?: boolean, sly?: boolean) {
    if (isRange) {
      if (sly) {
        this.selectToggleRange(i);
      } else {
        this.selectRange(i);
      }
    } else {
      if (sly) {
        this._cursor = i;
      } else {
        this.selectOnly(i);
      }
    }
    this._cursor = i;
  }

  /**
   * Returns the selected items as an array
   * @returns {Number[]}
   */
  getSelected(): number[] {
    return Array.from(this._items.values());
  }

  /**
   * Returns the size of the selected items
   * @returns {number}
   */
  size(): number {
    return this._items.size;
  }

  /**
   * Clears the selections
   */
  clear = (): void => {
    this._items.clear();
    this._last = this._cursor = 0;
  };
}
