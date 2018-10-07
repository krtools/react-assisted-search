import 'mocha';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {expectDropdown, expectEntry, expectNoDropdown} from '../utils';
import sleep from '../../src/util/sleep';
import {expect} from 'chai';
import {spy} from 'sinon';

describe('AssistedSearchOptions', () => {
  describe('options.autoSelectFirst', () => {
    it('will auto-select first result', async () => {
      let store = new AssistedSearchStore({
        getValues: () => ['A', 'B'],
        autoSelectFirst: true
      });
      store.focus();
      expectNoDropdown(store);

      store.setInput('a');
      // wait for dropdown
      await sleep();
      expectDropdown(store, 0);
    });
  });

  describe('options.getLoading', () => {
    it('shows the loading dropdown while waiting on the values dropdown to return', async () => {
      const loadingMsg = 'LOADING STUFF';
      const store = new AssistedSearchStore({
        getValues: () => ['A', 'B'],
        getLoading: () => loadingMsg
      });
      store.focus();
      store.setInput('a');
      expect(store.dropdown.loading, 'dropdown should be loading').eq(true);
      expect(store.isDropdownLoading(), 'should reflect loading state').eq(true);
      expect(store.dropdown.loadingDropdown).eq(loadingMsg);
      await sleep();
      expect(store.isDropdownLoading(), 'no longer loading').eq(false);
      expectDropdown(store, []);
    });
  });

  describe('options.customFacets', () => {
    it('allows custom facets when true', async () => {
      let store = new AssistedSearchStore({
        type: 'faceted',
        customFacets: true,
        getFacets: () => ['A', 'B'],
        getValues: () => ['a', 'b']
      });

      store.focus();
      store.setInput('a');
      await sleep();
      expectDropdown(store);
      store.setSelection();
      expect(store.input.value).eq('');
      expect(store.activeElement.facet.value).eq('a');

      store.setInput('c');
      await sleep();
      expectDropdown(store);
      store.setSelection();
      expectNoDropdown(store);

      expectEntry(store, 0, 'a', 'c', 1);
    });

    it('disallows custom facets when true', async () => {
      let store = new AssistedSearchStore({
        type: 'faceted',
        customFacets: false,
        getFacets: () => ['A', 'B'],
        getValues: () => ['a', 'b']
      });
      store.focus();
      store.setInput('a');

      await sleep();
      expectDropdown(store);
      store.setSelection();
      expect(store.input.value, 'should leave input value unchanged').eq('a');
      expect(store.activeElement.facet).eq(undefined);
    });
  });

  describe('options.customValues', () => {
    it('allows custom values when true', async () => {
      let store = new AssistedSearchStore({
        customValues: true,
        getValues: () => ['B', 'C']
      });
      store.focus();

      store.setInput('a');
      await sleep();
      expectDropdown(store, []);
      store.setSelection();
      expectEntry(store, 0, null, 'a', 1);
    });

    it('disallows custom values when false', async () => {
      let store = new AssistedSearchStore({
        customValues: false,
        getValues: () => ['B', 'C']
      });
      store.focus();
      store.setInput('a');
      await sleep();
      store.setSelection();

      // nothing should happen in this case until they select a value
      expect(store.entries).lengthOf(0);
      expect(store.input.value).eq('a');
    });

    it('allow custom values passing test function', () => {});

    it('disallow custom values failing test function', () => {});
  });

  describe.skip('options.rewriteValue', () => {
    it('rewrites values from custom input', () => {});
  });

  describe('options.minLength', () => {
    it('dropdown always shows up when min length = 0', async () => {
      let fn = spy(() => ['A', 'B']);
      let store = new AssistedSearchStore({
        getValues: fn,
        minLength: 0
      });
      store.focus();
      await sleep();
      expect(fn.callCount).eq(1);
      expectDropdown(store);

      store.setInput(''); // no change, test change detection
      expect(fn.callCount).eq(2);
      expectDropdown(store);
    });

    it('hides dropdown and does NOT call getValues when under minlength', async () => {
      let fn = spy(() => ['A', 'B']);
      let store = new AssistedSearchStore({
        getValues: fn,
        minLength: 2
      });
      store.focus();

      store.setInput('a');
      await sleep();
      expectNoDropdown(store);
      expect(fn.callCount).eq(0);
    });

    it('supports variable min length', async () => {
      let fn = spy(() => ['A', 'B']);
      let store = new AssistedSearchStore({
        minLength: e => (e.startsWith('a') ? 1 : 2),
        getValues: fn
      });
      store.focus();
      expectNoDropdown(store);
      expect(fn.callCount).eq(0);

      // not starting with 'a', minlength = 2
      store.setInput('b');
      await sleep();
      expectNoDropdown(store);
      expect(fn.callCount).eq(0);

      // minlength 2 is met
      store.setInput('bc');
      await sleep();
      expectDropdown(store);
      expect(fn.callCount).eq(1);

      // minlength is 1 here
      store.setInput('a');
      expectDropdown(store);
      expect(fn.callCount).eq(2);
    });
  });

  describe('types', () => {
    it('isSingle() return true for single', () => {
      expect(new AssistedSearchStore().isSingle()).eq(true);

      let single = new AssistedSearchStore({
        type: 'single'
      });
      expect(single.isSingle()).eq(true);
    });

    it('isMultiple() returns true for multiple', () => {
      let single = new AssistedSearchStore({
        type: 'multiple'
      });
      expect(single.isMultiple()).eq(true);
    });

    it('isFaceted() returns true for faceted', () => {
      let single = new AssistedSearchStore({
        type: 'faceted'
      });
      expect(single.isFaceted()).eq(true);
    });
  });
});
