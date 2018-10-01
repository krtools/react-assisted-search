import 'mocha';
/*eslint no-console: 0*/
import {expect} from 'chai';
import {range} from 'lodash';
import ItemSelector from '../../src/util/ItemSelector';

describe('ItemSelector', () => {
  let items = new ItemSelector();

  describe('selectOnly', () => {
    it('selects single value', () => {
      expect(items.size()).eq(0);
      testSelected(items, 2, false);
      items.selectOnly(2);
      testSelected(items, 2, true);
      testSelected(items, [1, 3], false);
      items.clear();
    });

    it('will reset last when clearing values, so last is 0', () => {
      // testing when cleared, that last resets properly
      testSelected(items, [0, 1, 3, 4], false);
      items.selectRange(4);
      testSelected(items, [0, 1, 2, 3, 4], true);
      items.selectOnly(2);
    });

    it('will deselect current value', () => {
      // changing
      items.selectOnly(1);
      testSelected(items, 1, true);
      testSelected(items, [3, 2], false);
    });

    it('does not change when re-selecting same value', () => {
      // select again, no change
      items.selectOnly(1);
      testSelected(items, 1, true);
    });
  });

  describe('selectRange', () => {
    it('selects a range from a single selection', () => {
      // click row 1
      items.selectOnly(2);
      expect(items.size()).eq(1);
      // shift+click row 4
      items.selectRange(4);
      testSelected(items, [2, 3, 4], true);
    });
    it('resets range from last single selection', () => {
      items.selectRange(1);
      expect(items.size()).eq(2);
      testSelected(items, [1, 2], true);
      testSelected(items, [3, 4], false);
    });
    it('manual (start, end)', () => {
      items.selectRange(3, 8);
      testSelected(items, range(3, 9), true);
      testSelected(items, [1, 2], false);
    });
  });

  describe('selectToggle', () => {
    it('toggles selection of single value', () => {
      items.selectOnly(1);
      expect(items.size()).eq(1);
      testSelected(items, 1, true);
    });
    it('toggles off single value', () => {
      items.selectToggle(1);
      testSelected(items, 1, false);
      expect(items.size()).eq(0);
    });
    it('deselects a value in a selected range', () => {
      items.selectRange(1, 5);
      testSelected(items, range(1, 6), true);
      items.selectToggle(3);
      testSelected(items, 3, false);
      expect(items.getSelected()).eql([1, 2, 4, 5]);
      testSelected(items, [1, 2, 4, 5], true);
    });
  });

  describe('selectAddRange', () => {
    it('does nothing unless something is selected', () => {
      // reset
      items.clear();
      expect(items.size()).eq(0);
      items.selectToggleRange(1);
      expect(items.size()).eq(0);
    });

    it('10 to 5 selects 5-10', () => {
      // only one to start
      items.selectOnly(10);
      expect(items.size()).eq(1);
      // ctrl+shift+click to 5, now 6 selected
      items.selectToggleRange(5);
      expect(items.size()).eq(6);
      testSelected(items, [5, 6, 7, 8, 9, 10], true);
    });

    it('from 5-10, then 12, now 8 selected', () => {
      // now go in the other direction, add 2
      items.selectToggleRange(12);
      expect(items.size()).eq(8);
      testSelected(items, [5, 6, 7, 8, 9, 10, 11, 12], true);
    });

    it('go back to 8, no change', () => {
      items.selectToggleRange(8);
      expect(items.size()).eq(8);
      testSelected(items, [5, 6, 7, 8, 9, 10, 11, 12], true);
    });

    it('go to 4, adds one, now 4-12 (9 total)', () => {
      // go back to 4, one more
      items.selectToggleRange(4);
      expect(items.size()).eq(9);
      testSelected(items, [4, 5, 6, 7, 8, 9, 10, 11, 12], true);
    });

    it('deselects ranges within ranges', () => {
      items.clear();
      // select a range
      items.selectRange(4, 10);
      expect(items.size()).eq(7);
      testSelected(items, [4, 5, 6, 7, 8, 9, 10], true);

      // deselect something inside of that range
      items.selectToggle(6);
      expect(items.size()).eq(6);
      testSelected(items, [4, 5, 7, 8, 9, 10], true);

      // now selectToggleRange to DE-select a range
      items.selectToggleRange(8);
      expect(items.size()).eq(4);
      testSelected(items, [4, 5, 9, 10], true);

      // go down to 12, now just 4,5
      items.selectToggleRange(12);
      expect(items.size()).eq(2);
      testSelected(items, [4, 5], true);

      // go down to 3, now 0
      items.selectToggleRange(3);
      expect(items.size()).eq(0);
    });
  });

  describe('selectNext', () => {
    let i = new ItemSelector();

    it('first call selects 2nd item when everything is initialized', () => {
      i.selectNext(false);
      expect(i.getSelected()).eql([1]);
    });

    it('selects next after random location', () => {
      i.selectOnly(23);
      i.selectNext(false);
      expect(i.getSelected()).eql([24]);
    });

    it('does not go above limit', () => {
      i.selectOnly(1);
      i.selectNext(false, 3);
      expect(i.getSelected()).eql([2]);
      i.selectNext(false, 3);
      expect(i.getSelected()).eql([2]);
    });

    it('selects (only) next when range is selected', () => {
      i.clear();
      i.selectOnly(5);
      i.selectNext(false, Infinity, true);
      i.selectNext(false, Infinity, true);
      i.selectNext(false, Infinity, true);
      // shift+space
      i.selectAtCursor(true, false);
      i.selectNext(false);
      expect(i.getSelected()).eql([9]);
    });
  });

  describe('selectPrevious', () => {
    let i = new ItemSelector();

    it('first call selects first element if nothing selected (special edge case) when cursor is at 0', () => {
      expect(i.getSelected()).eql([]);
      i.selectPrevious(false);
      expect(i.getSelected()).eql([0]);
    });

    it('selects previous after random location', () => {
      i.selectOnly(23);
      i.selectPrevious(false);
      expect(i.getSelected()).eql([22]);
    });

    it('does not go below zero', () => {
      i.selectOnly(1);
      i.selectPrevious();
      expect(i.getSelected()).eql([0]);
      i.selectPrevious();
      expect(i.getSelected()).eql([0]);
    });

    it('selects (only) previous when range was last selected', () => {
      i.clear();
      i.selectOnly(5);
      i.selectRange(10);
      i.selectNext(false);
      expect(i.getSelected()).eql([11]);
    });
  });

  describe('multiSelect=false', () => {
    let i = new ItemSelector();

    it('allows multi by default', () => {
      i.selectOnly(0);
      i.selectRange(2);
      expect(i.getSelected()).eql([0, 1, 2]);
    });

    it('deselects all but cursor when switching to single mode', () => {
      i.setMultiSelect(false);
      expect(i.getSelected()).eql([2]);
    });

    it('single mode only allows single selection', () => {
      i.selectOnly(2);
      expect(i.getSelected()).eql([2]);

      i.selectRange(4);
      expect(i.getSelected()).eql([4]);
    });

    it('select toggle[Range] act like selectOnly', () => {
      i.selectToggle(5);
      expect(i.getSelected()).eql([5]);

      i.selectToggleRange(6);
      expect(i.getSelected()).eql([6]);
    });

    it('next/prev act like selectOnly (+/- 1)', () => {
      i.selectNext();
      expect(i.getSelected()).eql([7]);
      i.selectNext(true);
      expect(i.getSelected()).eql([8]);

      i.selectPrevious();
      expect(i.getSelected()).eql([7]);
      i.selectPrevious(true);
      expect(i.getSelected()).eql([6]);
    });
  });
});

function testSelected(itemSelector: ItemSelector, i: number | number[], isSelected: boolean = false) {
  let items: number[] = Array.isArray(i) ? i : [i];
  items.forEach(item => {
    if (isSelected) {
      expect(itemSelector.isSelected(item), `${item} is NOT selected`).true;
    } else {
      expect(itemSelector.isSelected(item), `${item} is selected`).false;
    }
  });
}
