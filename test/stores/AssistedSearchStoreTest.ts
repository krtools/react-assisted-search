import 'mocha';
import {expect} from 'chai';
import {spy} from 'sinon';

import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {CHANGE, UPDATE} from '../../src/stores/EventTypes';
import {storeWithChangeHandler} from '../utils';

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

    before(() => {
      store = storeWithChangeHandler({
        type: 'faceted',
        getFacets: () => ['A','B'],
        getValues: () => ['a','b'],
      });
    });

    it.skip('deploys custom dropdown without getValues', ()=> {

    });

    it.skip('falls back to default getValues when return value is undefined', () => {

    });
  });
});
