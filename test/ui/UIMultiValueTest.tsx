import 'mocha';
import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {spy} from 'sinon';
import {expect} from 'chai';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {expectEntry} from '../utils';
import MultiValue, {MultiValueProps} from '../../src/impl/MultiValue';
import {toEntries} from '../../src/util/convertValues';

describe('<MultiValue>', () => {
  it('value in store matches initial prop value', () => {
    let el = mount(<MultiValue entries={['a']}/>);
    let store: AssistedSearchStore = el.instance()['_store'];
    let values = store.getValues();
    expect(values).lengthOf(1);
    expect(values[0].value).eq('a');
  });

  it('pre-populates components with value prop', () => {
    let el = mount(<MultiValue entries={['a']}/>);
    let inputs = el.find('input');
    expect(inputs, 'has main input and entry input').lengthOf(2);

    let entryInput = inputs.at(0).getDOMNode() as HTMLInputElement;
    expect(entryInput.value).eq('a');
    let mainInput = inputs.at(1).getDOMNode() as HTMLInputElement;
    expect(mainInput.value).eq('');
  });

  describe('onChange prop', () => {
    let fn = spy();
    let el: ReactWrapper<MultiValueProps>;
    let store: AssistedSearchStore;

    before(() => {
      el = mount(<MultiValue entries={[]} onChange={fn}/>);
      store = el.instance()['_store'];
    });

    it('(1) initial render does not trigger onChange', () => {
      expect(fn.callCount).eq(0);
    });

    it('(2) setValue triggers onchange', () => {
      expect(fn.callCount).eq(0);
      store.setEntries(toEntries(['abc']));
      expect(fn.callCount).eq(1);
      expectEntry(store, 0, null, 'abc', 1);
      expect(store.input.value).eq('');
    });

    it('(3) prop update does NOT trigger onChange', () => {
      expect(fn.callCount).eq(1);
      el.setProps({entries: ['b', 'c']});
      expect(store.input.value).eq('');
      expectEntry(store, 0, null, 'b', 2);
      expectEntry(store, 1, null, 'c', 2);
      expect(fn.callCount).eq(1);
    });
  });
});
