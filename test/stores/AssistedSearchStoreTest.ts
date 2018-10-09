import 'mocha';
import {expect} from 'chai';
import {spy} from 'sinon';

import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {CHANGE, SUBMIT, UPDATE} from '../../src/stores/EventTypes';
import {expectEntry, expectFacet, storeWithChangeHandler} from '../utils';
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
      expect(store.dropdown.content()).eq('content');
      expect(facets.callCount, 'facet getter called even when custom dropdown is used').eq(1);

      expect(store.dropdown.content(), 'content shows up before facets return').eq('content');
      await sleep();
      expect(store.dropdown.content(), 'content still present after facets return').eq('content');
      expect(store.isDropdownLoading()).eq(false);
      store.selectExact(0);
      expectFacet(store, 'A');

      expect(values.callCount, 'values not called yet').eq(0);
      store.setInput('b');
      expect(values.callCount, 'values now called by updateDropdown').eq(1);
      expect(store.dropdown.content(), 'content shows up before values return').eq('content');
      await sleep();
      expect(store.dropdown.content(), 'content still present after values return').eq('content');
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

    it('fires submit events only when selecting facet values', async () => {
      let store = new AssistedSearchStore({
        type:'faceted',
        getFacets: () => ['A', 'B'],
        getValues: () => ['a', 'b']
      });
      store.focus();

      let listener = spy();
      store.addListener(SUBMIT,listener);

      // setting candidate facet
      store.setInput('a');
      expect(listener.callCount).eq(0);
      await sleep();
      store.selectExact(0);
      expectFacet(store, 'A');
      expect(listener.callCount).eq(0);

      // setting value of entry 0
      store.setInput('a');
      await sleep();
      expect(listener.callCount).eq(0);
      store.selectExact(0);
      expect(listener.callCount).eq(1);
    });
  })
});
