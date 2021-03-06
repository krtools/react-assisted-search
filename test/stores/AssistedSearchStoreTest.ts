import 'mocha';
import {expect} from 'chai';
import {spy} from 'sinon';

import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {CHANGE, SUBMIT, UPDATE} from '../../src/stores/EventTypes';
import {
  expectDropdown,
  expectEntry,
  expectFacetCandidate,
  expectInput,
  expectNoDropdown,
  storeWithChangeHandler
} from '../utils';
import sleep from '../../src/util/sleep';

describe('AssistedSearchStore', () => {
  describe('runInAction()', () => {
    it('updates once after executing multiple actions', () => {
      let sp = spy();
      let store = new AssistedSearchStore();
      store.addListener(UPDATE, sp);

      store.runInAction(() => {
        store.setInput('asdf');
        store.setInput('asdf2');
      });

      expect(sp.callCount).eq(1);
    });
  });

  describe('selectValue()', () => {
    it('can set and overwrite single value', () => {
      let store = new AssistedSearchStore();
      store.selectValue('hello');
      expectInput(store, 'hello');
      expectEntry(store, 0, null, 'hello', 1);

      store.selectValue('abc');
      expectInput(store, 'abc');
      expectEntry(store, 0, null, 'abc', 1);
    });

    it('can set and re-set multi value', () => {
      let store = new AssistedSearchStore({
        type: 'multiple'
      });

      store.selectValue('value1');
      expectInput(store, '');
      expectEntry(store, 0, null, 'value1', 1);

      store.selectValue('value2');
      expectInput(store, '');
      expectEntry(store, 1, null, 'value2', 2);
    });

    it('can set and re-set faceted value', () => {
      let store = new AssistedSearchStore({
        type: 'faceted'
      }).focus();

      store.selectValue('facet1');
      expectInput(store, '', 'facet1');
      store.selectValue('value1');
      expectInput(store, '', null);
      expectEntry(store, 0, 'facet1', 'value1', 1);

      store.selectValue('facet2');
      expectInput(store, '', 'facet2');
      store.selectValue('value2');
      expectInput(store, '', null);
      expectEntry(store, 1, 'facet2', 'value2', 2);

      store.focus(1);
      store.selectValue('value2-update');
      expectEntry(store, 1, 'facet2', 'value2-update', 2);
    });
  });

  describe('change event', () => {
    it('updates only after changing value/entries', async () => {
      let onChange = spy();

      let store = new AssistedSearchStore();
      store.addListener(CHANGE, onChange);
      store.setInput('a');
      expect(onChange.callCount).eq(1);
    });
  });

  describe('options.customDropdown', () => {
    let store: AssistedSearchStore;
    let facets = spy(() => ['A', 'B']);
    let values = spy(() => ['a', 'b']);

    before(() => {
      store = storeWithChangeHandler({
        type: 'faceted',
        getFacets: facets,
        getValues: values,
        getDropdown: () => 'content'
      });
    });

    it('still loads dropdown items', async () => {
      expect(facets.callCount).eq(0);
      store.setInput('a');
      expect(store.isDropdownLoading()).eq(true);

      // fine with this throwing if undefined, we're in a test after all
      const getContent = () => store.dropdown.content!();

      expect(getContent()).eq('content');
      expect(facets.callCount, 'facet getter called even when custom dropdown is used').eq(1);

      expect(getContent(), 'content shows up before facets return').eq('content');
      await sleep();
      expect(getContent(), 'content still present after facets return').eq('content');
      expect(store.isDropdownLoading()).eq(false);
      store.selectExact(0);
      expectFacetCandidate(store, 'A');

      expect(values.callCount, 'values not called yet').eq(0);
      store.setInput('b');
      expect(values.callCount, 'values now called by updateDropdown').eq(1);
      expect(getContent(), 'content shows up before values return').eq('content');
      await sleep();
      expect(getContent(), 'content still present after values return').eq('content');
      store.selectExact(0);
      expectEntry(store, 0, 'A', 'a', 1);
    });
  });

  describe('onSubmit', () => {
    it('fires when selecting a single value', async () => {
      let store = new AssistedSearchStore({
        type: 'single',
        getValues: () => ['a', 'b']
      });
      store.focus();
      let fn = spy();
      store.addListener(SUBMIT, fn);

      store.setInput('a');
      await sleep();
      expect(fn.callCount).eq(0);

      store.setValue('ab');
      await sleep();
      expect(fn.callCount).eq(0);

      store.selectExact(0);
      expect(fn.callCount).eq(1);
    });

    it('fires submit when empty value is given, but no new entry/candidate', () => {
      let store = new AssistedSearchStore({
        type: 'faceted'
      }).focus();

      let listener = spy();
      store.addListener(SUBMIT, listener);
      expect(listener.callCount).eq(0);

      store.setInput('');
      expect(listener.callCount).eq(0);

      store.setSelection(true, true);
      expectInput(store, '', null);
      // key check here: it fires a submit event even though nothing changed
      expect(listener.callCount).eq(1);

      store.selectValue('facet1', true, true);
      expect(listener.callCount).eq(1);

      store.selectValue('value1', true, true);
      expect(listener.callCount).eq(2);

      // empty input value
      store.setSelection(true, true);
      // no changes to any of the inputs or values
      expectEntry(store, 0, 'facet1', 'value1', 1);
      expectInput(store, '', null);
      // key check here: a submit event gets fired, but nothing else happens/changes
      expect(listener.callCount).eq(3);
    });

    it('fires submit events only when selecting facet values', async () => {
      let store = new AssistedSearchStore({
        type: 'faceted',
        getFacets: () => ['A', 'B'],
        getValues: () => ['a', 'b']
      });
      store.focus();

      let listener = spy();
      store.addListener(SUBMIT, listener);

      // setting candidate facet
      store.setInput('a');
      expect(listener.callCount).eq(0);
      await sleep();
      store.selectExact(0);
      expectFacetCandidate(store, 'A');
      expect(listener.callCount).eq(0);

      // setting value of entry 0
      store.setInput('a');
      await sleep();
      expect(listener.callCount).eq(0);
      store.selectExact(0);
      expect(listener.callCount).eq(1);
    });
  });

  describe('supressing dropdown on clicking item', () => {
    it('does not call getValues more than once', async () => {
      let getValues = spy(() => ['a']);
      let store = new AssistedSearchStore({
        minLength: 1,
        getValues: getValues
      }).focus();
      expect(getValues.callCount, 'getValues should not be called yet').eq(0);

      await sleep();
      store.setInput('a');
      expect(getValues.callCount, 'getValues should be called from input change').eq(1);

      await sleep();
      expectDropdown(store);
      store.selectExact(0, true);

      await sleep();
      expectNoDropdown(store);
      expect(getValues.callCount, 'getValues should not be called again after selection').eq(1);
    });
  });
});
