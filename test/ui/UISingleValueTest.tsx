import 'mocha';
import * as React from 'react';
import {expect} from 'chai';
import {mount, ReactWrapper} from 'enzyme';
import {spy} from 'sinon';

import SingleValue, {SingleValueProps} from '../../src/impl/SingleValue';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {SearchEntry} from '../../src/types';
import {expectEntry, expectStoreSynced} from '../utils';

describe('<SingleValue>', () => {
  it('value in store matches initial prop value', () => {
    let el = mount(<SingleValue value="abc"/>);
    let store: AssistedSearchStore = el.instance()['_store'];
    expect(store.input.value).eq('abc');
  });

  it('value in input DOM node matches store value', () => {
    let el = mount(<SingleValue value="abc"/>);
    let input = el.find('input').getDOMNode() as HTMLInputElement;
    expect(input.value).eq('abc');
    expectStoreSynced(el);
  });

  describe('onChange prop', () => {
    let fn = spy();
    let el: ReactWrapper<SingleValueProps>;
    let store: AssistedSearchStore;

    before(() => {
      el = mount(<SingleValue value="" onChange={fn}/>);
      store = el.instance()['_store'];
    });

    afterEach(() => {
      el.update();
      expectStoreSynced(el);
    });

    it('(1) initial render does not trigger onChange', () => {
      expect(fn.callCount).eq(0);
    });

    it('(2) setValue triggers onchange', () => {
      expect(fn.callCount).eq(0);
      store.setValue('abc');
      expect(fn.callCount).eq(1);

      let call = fn.getCall(0);
      let arg0: string = call.args[0];

      expect(arg0, 'expecting change value to be same as set value').eq('abc');
      expect(call.args[1]).eql([
        {
          value: {
            value: 'abc'
          }
        }
      ] as SearchEntry[]);
      expect(call.args[2], '3rd param is store').eq(store);
    });

    it('(3) re-render reverts state change in store', () => {
      el.setState({});
      expect(store.input.value, 'value should be back to prop value').eq('');
      // expectEntry(store, 0, null, '', 1);
    });

    it('(4) prop update does NOT trigger onChange', () => {
      expect(fn.callCount).eq(1);
      el.setProps({value: 'abcd'});
      expect(store.input.value).eq('abcd');
      expectEntry(store, 0, null, 'abcd', 1);
      expect(fn.callCount).eq(1);
    });
  });
});
