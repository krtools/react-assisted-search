import 'mocha';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {expect} from 'chai';
import sleep from '../../src/util/sleep';
import {
  expectDropdown,
  expectEntry,
  expectFacetCandidate,
  expectInput,
  expectNoFacetCandidate,
  expectValue
} from '../utils';
import {createPartial, toEntry, toValue} from '../../src/util/convertValues';

describe('Faceted Mode', () => {
  describe('placeholder()', () => {
    let store: AssistedSearchStore;
    before(() => {
      store = new AssistedSearchStore({
        type: 'faceted',
        getFacets: () => ['A', 'B'],
        getValues: () => ['a', 'b'],
        placeholder: field => {
          return field ? field : '123';
        }
      });
    });

    it('(1) displays placeholder for main input when empty', () => {
      store.focus();
      expect(store.placeholder()).eq('123');
    });

    it('(2) displays placeholder for specific facet', async () => {
      store.setInput('a');
      await sleep();
      expect(store.dropdown.items).lengthOf(2);
      store.selectExact([0]);
      expect(store.placeholder(), 'placeholder should be field name').eq('A');
    });
  });

  describe('current facet', () => {
    let store: AssistedSearchStore;
    before(() => {
      store = new AssistedSearchStore({
        type: 'faceted',
        getFacets: () => ['A', 'B'],
        getValues: () => ['va', 'vb']
      });
      store.focus();
    });

    it('(1) adds candidate when selecting a value from the dropdown', async () => {
      expect(store.entries).lengthOf(0);
      store.setInput('a');
      await sleep();
      store.selectExact(0);
      expect(store.input.value, 'input value should be cleared').eq('');
      expect(store.entries, 'no entries yet').lengthOf(0);
      expect(store.isActiveEntry(), 'main input is focused').eq(true);
      expectFacetCandidate(store, 'A');
    });

    it('(2) cancelling facet candidate updates dropdown', () => {
      store.setInputSelection(0, 0);
      expectFacetCandidate(store, 'A');
      expect(store.deleteBehind(), 'tells to preventDefault()').eq(true);
      expect(store.input.facet, 'candidate facet should be removed now').eq(null);
      expect(store.input.value, 'main input still empty').eq('');
    });

    it('(3) removes facet candidate after selecting a value', async () => {
      store.setInput('a');
      await sleep();
      expect(store.dropdown.items).lengthOf(2);
      store.selectExact([0]);
      expectFacetCandidate(store, 'A');
      store.setInput('a');
      await sleep();
      store.selectExact([0]);
      expect(store.input.facet, 'candidate now null since a value was chosen').eq(null);
    });
  });

  it('deleteAhead on selected text inside facet only deletes text (not facet name)', () => {
    let store = new AssistedSearchStore();
    store.setEntries([
      {
        facet: {value: 'ABC'},
        value: {value: 'D'}
      }
    ]);

    store.focus(0);
    store.setInputSelection(0, 1);
    // does nothing, input.value does not change however, that's handled by change event
    expect(store.deleteAhead()).eq(undefined);
  });

  describe('isStandaloneValue()', () => {
    let store: AssistedSearchStore;
    before(async () => {
      store = new AssistedSearchStore({
        type: 'faceted',
        minLength: 0,
        getFacets: () => ['A', 'B'],
        getValues: () => ['a', 'b'],
        isStandaloneValue: input => input.includes(':')
      });
      store.focus();
      // wait for dropdown callback
      await sleep();
    });

    it('(1) sets a value normally when isStandaloneValue() returns false(y)', async () => {
      store.selectExact(0);
      await sleep();
      store.selectExact(0);
      expectEntry(store, 0, 'A', 'a', 1);
    });

    it('(2) sets a standalone value with no facet', () => {
      expectNoFacetCandidate(store);
      store.setInput('a:b');
      store.setSelection();
      expect(store.input.value, 'input value should be cleared').eq('');
      expectNoFacetCandidate(store);
      expectEntry(store, 1, null, 'a:b', 2);
    });

    it('(3) selected value takes precedence over input value', async () => {
      // for dropdown
      store.focus();
      store.setInput('a:b');
      await sleep();
      expectDropdown(store);
      store.selectExact(0);
      expectInput(store, '', 'A');
      await sleep();
      expectDropdown(store);
      store.selectExact(0);
      expectEntry(store, 2, 'A', 'a', 3);
    });

    it('(4) standalone values can be edited', async () => {
      // gonna re-use a:b from step 2
      expectEntry(store, 1, null, 'a:b', 3);
      store.focus(1);

      store.setEntryValue(1, 'a:c');
      store.setSelection();
      expectEntry(store, 1, null, 'a:c');
    });

    it.skip('(5) standalone values can be edited and become a faceted value', async () => {
      store.entries = [store.entries[1]];
      expectEntry(store, 0, null, 'a:c', 1);
      store.focus(0);

      // triggers facets
      store.setEntryValue(0, 'a');
      await sleep();
      expectDropdown(store);
      store.selectExact(0);

      // triggers facet values
      expect(store.isActiveEntry(0));
      expectValue(store, '', 0);
      expectFacetCandidate(store, 'A', 0);

      await sleep();
      store.selectExact(0);
      expectEntry(store, 0, 'A', 'a', 1);
    });
  });

  describe('isFacet', () => {
    let store: AssistedSearchStore;
    before(() => {
      store = new AssistedSearchStore({
        type: 'faceted',
        getFacets: () => ['A', {value: 'a:b', isFacet: false}],
        getValues: () => ['a', 'b']
      });
      store.focus();
    });

    it('accepts a facet as a standalone value and sets the entry', async () => {
      store.setInput('a');
      await sleep();
      expectDropdown(store);
      store.selectExact(1);
      expect(store.input.value).eq('');
      expectNoFacetCandidate(store);
      expectEntry(store, 0, null, 'a:b', 1);
    });

    it.skip('can edit the facet, will bring up the currentFacet inside of the entry', () => {
      store.focus(0);
      // THIS is breaking in the UI, check what it is
      store.setEntryValue(0, 'a:c');
      expectEntry(store, 0, null, 'a:c', 1);
      store.setSelection();
      // couple problems here
      // 1. we can't set current facet from here
      // 2. setEntryValue doesn't do isStandalone or any of the other things
      //    we might want to have a _getEntryFromInput that generates the entry?
    });

    it.skip('can edit the facet as a standalone value if applicable');
  });

  describe('Faceted Mode: Partial Values', () => {
    it('adds in partial autocomplete for values', async () => {
      let store = new AssistedSearchStore({
        type: 'faceted',
        getFacets: () => ['A', 'B'],
        getValues: v => [createPartial(v + ' x')]
      });
      store.focus();
      store.setInput('a');

      await sleep();
      // facet value
      expectDropdown(store);
      store.selectExact(0);
      expectInput(store, '', 'A');

      store.setInput('a');
      await sleep();
      store.selectExact(0);
      expectInput(store, 'a x', 'A');
    });

    it('supports partial autocomplete for facet fields', async () => {
      let store = new AssistedSearchStore({
        type: 'faceted',
        getFacets: v => [createPartial(v + ' x')]
      });
      store.focus();
      store.setInput('a');
      await sleep();
      store.selectExact(0);
      expectNoFacetCandidate(store);
      expectValue(store, 'a x');

      store.setSelection();
      expectFacetCandidate(store, 'a x');
    });
  });

  describe('options.rewriteFacet', () => {
    it('can rewrite facet value coming from user input', () => {
      let store = new AssistedSearchStore({
        type: 'faceted',
        rewriteFacet: str => str.value + '_rewrite'
      }).focus();

      store.setInput('facet');
      store.setSelection(true);

      expect(store.input.facet).not.eq(undefined);
      expectFacetCandidate(store, 'facet_rewrite');
    });
  });

  describe('options.overrideEntry', () => {
    it('can override entry when entering facet', () => {
      let store = new AssistedSearchStore({
        type: 'faceted',
        overrideEntry: input => toEntry(input)
      }).focus();

      store.setInput('val');
      store.setSelection();

      expectEntry(store, 0, null, 'val');
    });

    it('can override entry when entering value', () => {
      let store = new AssistedSearchStore({
        type: 'faceted',
        overrideEntry: (input, facet) => (facet ? {facet, value: toValue('val')} : null)
      }).focus();

      store.setInput('f1');
      store.setSelection();
      expectFacetCandidate(store, 'f1');
      store.setInput('hello');
      store.setSelection();
      expectEntry(store, 0, 'f1', 'val');
    });

    it('can override entry when selecting facet from dropdown', async () => {
      let store = new AssistedSearchStore({
        type: 'faceted',
        getFacets: () => ['A'],
        overrideEntry: () => toEntry({value: 'val'})
      }).focus();

      store.setInput('a');
      await sleep();
      store.selectExact([0]);

      expectEntry(store, 0, null, 'val');
    });

    it('can override entry when selecting value from dropdown', async () => {
      let store = new AssistedSearchStore({
        type: 'faceted',
        getFacets: () => ['A'],
        getValues: () => ['a'],
        overrideEntry: (input, facet) => (facet ? {facet, value: toValue('val')} : null)
      }).focus();

      // setting facet, doesn't really matter, it's the value override we care about
      store.setInput('a');
      await sleep();
      store.selectExact(0);
      expectFacetCandidate(store, 'A');

      store.setInput('b');
      await sleep();
      store.selectExact(0);
      expectEntry(store, 0, 'A', 'val');
    });
  });
});
