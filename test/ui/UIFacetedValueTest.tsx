import 'mocha';
import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {spy} from 'sinon';
import {expect} from 'chai';

import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {expectArgs, expectEntry, expectStoreSynced, getStore} from '../utils';
import {toFacetValue} from '../../src/util/convertValues';
import FacetedValue, {FacetedValueProps} from '../../src/impl/FacetedValue';
import {SearchEntry} from '../../src/types';

describe('<FacetedValue>', () => {
  it('value in store matches initial prop value', () => {
    let el = mount(<FacetedValue entries={[toFacetValue('a', 'b')]}/>);
    let store: AssistedSearchStore = getStore(el);
    expectEntry(store, 0, 'a', 'b', 1);
  });

  it('prop-populates entries', () => {
    let el = mount(<FacetedValue entries={[toFacetValue('a', 'b'), toFacetValue('c', 'd')]}/>);
    expectStoreSynced(el);
  });

  describe('onChange prop', () => {
    let fn = spy();
    let el: ReactWrapper<FacetedValueProps>;
    let store: AssistedSearchStore;

    before(() => {
      el = mount(<FacetedValue entries={[]} onChange={fn}/>);
      store = getStore(el);
    });

    afterEach(() => {
      el.update();
      expectStoreSynced(el);
    });

    it('(1) initial render does not trigger onChange', () => {
      expect(fn.callCount).eq(0);
    });

    it('(2) setValue triggers onChange', () => {
      expect(store.entries).lengthOf(0);
      expect(fn.callCount).eq(0);
      store.setEntries([toFacetValue('f', 'v')]);
      expectEntry(store, 0, 'f', 'v', 1);
      expect(store.input.value).eq('');

      // validate args
      expectArgs(fn, 0, '');

      let entries = fn.getCall(0).args[1] as SearchEntry[];
      expect(entries).eql([
        {
          facet: {
            value: 'f'
          },
          value: {
            value: 'v'
          }
        }
      ] as SearchEntry[]);
    });

    it('(3) prop update does NOT trigger onChange', () => {
      expect(fn.callCount).eq(1);
      el.setProps({entries: [toFacetValue('a', 'b'), toFacetValue('c', 'd')]});
      expect(store.input.value).eq('');
      expectEntry(store, 0, 'a', 'b', 2);
      expectEntry(store, 1, 'c', 'd', 2);
      expect(fn.callCount).eq(1);
    });
  });

  it('Entry uses label when label is included', () => {
    let store = new AssistedSearchStore({
      type: 'faceted'
    });

    store.focus();
    store.setEntries([
      {
        facet: {value: 'A', label: 'Ehh'},
        value: {value: 'a'}
      }
    ]);

    let el = mount(<FacetedValue store={store}/>);
    let val = el.find('.assisted-search-entry-facet');
    expect(val).lengthOf(1);
    expect((val.getDOMNode() as HTMLElement).innerText).eq('Ehh');

    store.setEntries([
      {
        facet: {value: 'A'},
        value: {value: 'a'}
      }
    ]);
    val = el.find('.assisted-search-entry-facet');
    expect(val).lengthOf(1);
    expect((val.getDOMNode() as HTMLElement).innerText).eq('A');
  });
});
