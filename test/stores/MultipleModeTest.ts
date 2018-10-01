import 'mocha';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {createPartial, toEntries, toOptions} from '../../src/util/convertValues';
import {expect} from 'chai';
import sleep from '../../src/util/sleep';
import {expectEntry, expectFocus, storeWithChangeHandler} from '../utils';

describe('Multiple Mode', () => {
  it('able to select multiple values', async () => {
    let store = new AssistedSearchStore({type: 'multiple'});
    store.focus();

    store.dropdown.items = await toOptions(['0123a']);
    store.selectExact(0);
    expect(store.entries).lengthOf(1);

    store.dropdown.items = await toOptions(['0123b']);
    store.selectExact(0);
    expect(store.entries).lengthOf(2);

    expect(store.getValues().map(e => e.value)).eql(['0123a', '0123b']);
  });

  describe('arrow left', () => {
    let store: AssistedSearchStore;

    before(() => {
      store = new AssistedSearchStore({type: 'multiple'});
      store.focus();
    });

    it('left when cursor not @ 0:0', () => {
      expect(store.activeElement).eq(store.input);
      store.setInputSelection(2, 2);
      expect(store.activeElement.selectionStart).eq(2);
      expect(store.activeElement.selectionEnd).eq(2);
      expect(store.moveLeft()).eq(undefined);
      expect(store.activeElement).eq(store.input);
    });

    it('left when cursor @ 0:0, no entries', () => {
      store.setInputSelection(0, 0);
      // we're at 0, but have no entries, so we still do nothing
      expect(store.moveLeft()).eq(undefined);
      expect(store.activeElement).eq(store.input);
    });

    it('left when cursor @ 0:0, has entry, main input focused', async () => {
      store.setEntries(await toEntries(['A']));
      store.focus();
      store.setInputSelection(0, 0);
      expect(store.moveLeft()).eq(true);
      expect(store.activeElement).eq(store.entries[0].input);
    });
  });

  describe('arrow left/right w/ entries', () => {
    let store: AssistedSearchStore;
    before(() => {
      store = new AssistedSearchStore({type: 'multiple'});
      store.setEntries(toEntries(['0123a', '0123b']));
      store.focus(store.entries[0]);
    });

    it('right when cursor not @ len-1, in entry', () => {
      store.setInputSelection(0, 0);
      expect(store.moveRight()).eq(undefined);
    });

    it('right when @ len-1, at entries[0 of 2]', async () => {
      store.focus(store.entries[0]);
      // previous entry is still 0123
      store.setInputSelection(5, 5);
      expect(store.moveRight()).eq(true);
      expect(store.isActiveEntry(1)).eq(true);
    });

    it('right when cursor @ len-1', () => {
      expect(store.isActiveEntry(1)).eq(true);
      store.setInputSelection(5, 5);
      expect(store.moveRight()).eq(true);
      expect(store.activeElement === store.input);
    });

    describe('repeated moveLeft(), (de)selecting entries', () => {
      it('(1) does not trigger select when cursor > 0', () => {
        store.focus(1, false, 2, 2);
        expect(store.getActiveEntry().selected, 'precondition').eq(false);

        expect(store.moveLeft(), 'does not prevent default').eq(undefined);
        expect(store.getActiveEntry().selected, 'does not trigger select when cursor > 0').eq(false);
        expect(store.isActiveEntry(1), 'focus still on this entry').eq(true);
      });

      it('(2) selects entry when cursor = 0', () => {
        store.setInputSelection(0, 0);
        expect(store.moveLeft(), 'prevents default').eq(true);
        expect(store.isActiveEntry(1), 'entry still focused').eq(true);
        expect(store.getActiveEntry().selected, 'entry should now be selected').eq(true);
      });

      it('(3) goes to prev on next moveLeft()', () => {
        expect(store.moveLeft(), 'prevents default').eq(true);
        expect(store.isActiveEntry(0), 'moved to prev entry now').eq(true);
        expect(store.getSelectedEntries(), 'all entries deselected').lengthOf(0);
        expect(store.activeElement.selectionStart, 'cursor at end of input').eq(-1);
      });

      it('(4) cursor movement is now normal', () => {
        // have to set input selection manually
        store.setInputSelection(4, 4);
        expect(store.moveLeft()).eq(undefined);
        expect(store.isActiveEntry(0), 'moved to prev entry now').eq(true);
        expect(store.getSelectedEntries(), 'all entries deselected').lengthOf(0);
      });
    });

    describe('repeated moveRight(), (de)selecting entries', () => {
      it('(1) does not trigger select when cursor > 0', () => {
        store.focus(0, false, 3, 3);
        expect(store.getActiveEntry().selected, 'precondition').eq(false);

        expect(store.moveRight(), 'should NOT prevent default').eq(undefined);
        expect(store.getActiveEntry().selected, 'does not trigger select when cursor > len').eq(false);
        expect(store.getActiveEntryIdx(), 'focus should still be on this entry').eq(0);
      });

      it('(2) moves to next entry and selects when cursor = len', () => {
        store.setInputSelection(5, 5);
        expect(store.moveRight(), 'should prevent default').eq(true);
        expect(store.getActiveEntryIdx(), 'entry[1] should now be focused').eq(1);
        expect(store.getActiveEntry().selected, 'entry[1] should also be selected').eq(true);
      });

      it('(3) deselects entry', () => {
        expect(store.moveRight(), 'should prevent default').eq(true);
        expect(store.getActiveEntryIdx(), 'moved to next entry now').eq(1);
        expect(store.getSelectedEntries(), 'all entries deselected').lengthOf(0);
        expect(store.activeElement.selectionStart, 'cursor at end of input').eq(0);
      });

      it('(4) cursor movement is now normal', () => {
        expect(store.moveRight(), 'should NOT prevent default').eq(undefined);
        expect(store.getActiveEntryIdx(), 'still on entries[1]').eq(1);
        expect(store.getSelectedEntries(), 'all entries deselected').lengthOf(0);
      });
    });
  });

  describe('deleteAhead()', () => {
    let store: AssistedSearchStore;

    before(() => {
      store = new AssistedSearchStore({
        type: 'multiple'
      });
      store.setEntries(toEntries(['A', 'B', 'C']));
      store.focus();
    });

    it('does nothing when on main input', () => {
      expect(store.entries).lengthOf(3);
      store.input.value = 'ABC';
      store.setInputSelection(0, 0);
      expect(store.deleteAhead()).eq(undefined);
      expect(store.entries).lengthOf(3);
    });

    it('does nothing when on main input and start = len', () => {
      store.setInputSelection(3, 3);
      expect(store.deleteAhead()).eq(undefined);
      expect(store.entries).lengthOf(3);
    });

    it('deletes next entry when on non-last entry', () => {
      store.focus(0);
      store.entries[0].input.value = 'A';
      store.setInputSelection(1, 1);
      expect(store.deleteAhead(), 'should delete next entry').eq(true);
      expect(store.entries).lengthOf(2);
      expect(store.isActiveEntry(0)).eq(true);
    });
  });

  describe('focus/dropdown behavior', () => {
    let store: AssistedSearchStore;
    before(() => {
      store = new AssistedSearchStore({
        type: 'multiple',
        minLength: 0,
        getValues: value => {
          return toOptions(value === 'A' ? ['A'] : ['B']);
        }
      });
      store.setEntries(toEntries(['A', 'B']));
      store.focus();
    });

    it('main input dropdown displays when minlength is 0 and input is empty', async () => {
      await sleep();
      expect(store.dropdown.items[0].value).eq('B');
    });

    it('resets dropdown after changing the value of the active input', async () => {
      store.setInput('A');
      await sleep();
      expect(store.dropdown.items[0].value).eq('A');
    });

    it('resets dropdown after focusing a different entry', async () => {
      store.focus(1);
      await sleep();
      expect(store.dropdown.items[0].value).eq('B');

      store.focus(0);
      await sleep();
      expect(store.dropdown.items[0].value).eq('A');
    });
  });

  describe('deleteBehind()', () => {
    let store: AssistedSearchStore;

    before(() => {
      store = new AssistedSearchStore({
        type: 'multiple'
      });
      store.setEntries(toEntries(['A', 'B', 'C']));
      store.focus();
    });

    it('does nothing when input start is > 0', () => {
      store.setInput('abc');
      store.setInputSelection(1, 1);
      expect(store.entries).lengthOf(3);
      expect(store.deleteBehind()).not.eq(true);
      expect(store.entries).lengthOf(3);
      expect(store.activeElement).eq(store.input);
    });

    it('focuses rightmost entry when selection is 0:0', () => {
      store.setInputSelection(0, 0);
      expect(store.entries).lengthOf(3);
      expect(store.deleteBehind()).eq(true);
      expect(store.entries).lengthOf(3);
      expect(store.getActiveEntryIdx()).eq(2);
    });

    it('can delete all entries', () => {
      // precondition
      expect(store.entries).lengthOf(3);

      // backspace
      store.setInput('', 2);
      expect(store.deleteBehind()).eq(true);
      expect(store.entries).lengthOf(2);
      expectFocus(store, 1);

      // backspace, removes last entry
      store.setInput('', 1);
      expect(store.deleteBehind()).eq(true);
      expect(store.entries).lengthOf(1);
      expectFocus(store, 0);

      // backspace clears last entry
      store.setInput('', 0);
      expect(store.deleteBehind()).eq(true);
      expectFocus(store);

      // finally last backspace does nothing
      store.setInput('');
      expect(store.deleteBehind()).eq(undefined);
    });

    it('deleting from entries[0] deletes active entry and focuses main input', () => {
      store.setEntries(toEntries(['A']));
      store.focus(0);
      store.setInputSelection(0, 0);
      expect(store.deleteBehind()).eq(true);
      expect(store.isActiveEntry(), 'main input should be focused').eq(true);
      expect(store.entries).lengthOf(0);
    });
  });

  describe('moveToHome()', () => {
    let store: AssistedSearchStore;
    before(() => {
      store = new AssistedSearchStore({
        type: 'multiple',
        getValues: () => ['A', 'B', 'C']
      });
      store.focus();
      store.setEntries(toEntries(['a', 'b', 'c']));
    });

    it('(1) behaves as normal when on main input and cursor > 0, dropdown not focused', async () => {
      // setup
      store.setInput('01234');
      await sleep();
      store.clearDropdown();
      expect(store.dropdown.items).lengthOf(0);
      expect(store.hasSelectedItems()).eq(false);

      store.setInputSelection(3, 3);
      expect(store.moveToHome()).eq(undefined);
      expect(store.isActiveEntry(), 'main input should still be focused').eq(true);
      expect(store.getSelectedEntries()).lengthOf(0);
    });

    it('(2) normal behavior goes to 0 when on main input, cursor > 0, dropdown not focused', async () => {
      // setting up input / dropdown
      store.setInput('01234');
      store.setInputSelection(1, 1);
      await sleep();
      expect(store.dropdown.items).lengthOf(3);
      expect(store.moveToHome()).eq(undefined);
      expect(store.hasSelectedItems()).eq(false);
      expect(store.getSelectedEntries()).lengthOf(0);
      expect(store.isActiveEntry()).eq(true);
    });

    it('(3) selected goes to 0 when cursor=0, dropdown open & selected=1', () => {
      store.setInputSelection(0, 0);
      store.setSelectedItems([1]);
      expect(store.isSelectedItem(1)).eq(true);
      expect(store.moveToHome()).eq(true);
      expect(store.isSelectedItem(1)).eq(false);
      expect(store.isSelectedItem(0)).eq(true);
    });

    it('(4) does nothing when selected=0', () => {
      expect(store.moveToHome()).eq(true);
      expect(store.isSelectedItem(0)).eq(true);
      expect(store.isActiveEntry()).eq(true);
      expect(store.getSelectedEntries()).lengthOf(0);
    });

    it('(5) moves to first entry when cursor=0, dropdown open but nothing selected', async () => {
      store.setInputSelection(0, 0);
      store.setInput('a');
      await sleep();
      store.clearSelectedItems();
      expect(store.moveToHome(), 'should preventDefault()').eq(true);
      expect(store.isActiveEntry(0), 'goes to first entry').eq(true);
      expect(store.getActiveEntry().input.selectionStart, 'selectionStart of entry input should be 0').eq(0);
      expect(store.getSelectedEntries(), 'only entry[0] is selected').eql([store.entries[0]]);
    });

    it('(6) moves to first entry when cursor=0, dropdown not open', async () => {
      store.focus();
      store.setInput('a');
      await sleep();
      store.setInputSelection(0, 0);
      store.clearDropdown();
      expect(store.moveToHome(), 'should preventDefault()').eq(true);
      expect(store.isActiveEntry(0), 'goes to first entry').eq(true);
      expect(store.getActiveEntry().input.selectionStart, 'selectionStart of entry input should be 0').eq(0);
      expect(store.getSelectedEntries(), 'only entry[0] is selected').eql([store.entries[0]]);
    });
  });

  describe('moveToEnd()', () => {
    let store: AssistedSearchStore;
    before(() => {
      store = new AssistedSearchStore({
        type: 'multiple',
        getValues: () => ['A', 'B', 'C']
      });
      store.focus();
      store.setEntries(toEntries(['abc', 'def']));
    });

    it('(1) default behavior when cursor != len, dropdown not focused', async () => {
      store.setInput('abc');
      await sleep();
      expect(store.dropdown.items).lengthOf(3);
      expect(store.hasSelectedItems()).eq(false);
      store.setInputSelection(0, 0);

      expect(store.moveToEnd()).eq(undefined);
      expect(store.getSelectedEntries(), 'should not have selected entries').eql([]);
      expect(store.hasSelectedItems(), 'should not have selected dropdown items').eq(false);
      expect(store.dropdown.items, 'dropdown still open').lengthOf(3);
    });

    it('(2) default behavior when cursor = len, dropdown open but not focused', async () => {
      // ensure not ignored just because input selection is at len
      store.setInputSelection(3, 3);
      expect(store.moveToEnd()).eq(undefined);
    });

    it('(3) selected goes to end when dropdown is focused, selected != len', () => {
      expect(store.dropdown.items).lengthOf(3);
      store.setSelectedItems([0]);
      expect(store.moveToEnd()).eq(true);
      expect(store.isSelectedItem(2)).eq(true);
      expect(store.getSelectedEntries(), 'should not have selected entries').eql([]);
    });

    it('(4) selected stays at end when dropdown is focused, selected = len', () => {
      expect(store.moveToEnd()).eq(true);
      expect(store.isSelectedItem(2)).eq(true);
      expect(store.getSelectedEntries(), 'should not have selected entries').eql([]);
    });

    it('(5) when cursor != end, on entry 0, default behavior', () => {
      store.focus(0, false, 0, 0);
      store.clearSelectedItems();
      expect(store.moveToEnd()).eq(undefined);
      expect(store.hasSelectedItems()).eq(false);
      expect(store.getSelectedEntries(), 'should not have selected entries').eql([]);
      expect(store.getActiveEntryIdx()).eq(0);
    });

    it('(6) when cursor == end on entry 0, move to main input', () => {
      store.setInputSelection(3, 3);
      expect(store.getActiveEntryIdx()).eq(0);
      expect(store.moveToEnd(), 'should call preventDefault()').eq(true);
      expect(store.isActiveEntry(), 'main input now focused').eq(true);
      expect(store.activeElement.selectionStart, 'resets selectionStart to 0').eq(0);
    });
  });

  describe('Multiple Mode: Partial Values', () => {
    it('selected option changes the value but does not add an entry', async () => {
      let store = new AssistedSearchStore({
        type: 'multiple',
        getValues: (v: string) => ['A', createPartial(`${v} text`, 'text')]
      });
      store.focus();
      store.setInput('a');
      await sleep();
      store.selectExact(1);
      expect(store.entries).lengthOf(0);
      expect(store.input.value, 'added value').eq('a text');
    });
  });

  describe('onChange when customValues=false', () => {
    it('only triggers onChange when a valid value is committed', () => {});
  });

  describe('setEntries()', () => {
    it('does not lose focus of active entry', () => {
      let store = storeWithChangeHandler({type: 'faceted'});
      // adding facet
      store.setInput('a');
      store.setSelection();
      store.setInput('a');
      store.setSelection();

      // expect a single faceted entry
      expectEntry(store, 0, 'a', 'a', 1);

      // prepare backspace
      store.setInputSelection(0, 0);
      store.deleteBehind();

      // data binding triggers change to setEntries, but focus (activeElement) remains on new entry
      expectFocus(store, 0);
    });
  });
});
