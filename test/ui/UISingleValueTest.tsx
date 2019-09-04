import 'mocha';
import * as React from 'react';
import {expect} from 'chai';
import {mount, ReactWrapper} from 'enzyme';
import {spy} from 'sinon';

import SingleValue, {SingleValueProps} from '../../src/impl/SingleValue';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {SearchEntry} from '../../src/types';
import {expectDropdown, expectEntry, expectNotNil, expectStoreSynced, getInstanceDropdown, getStore} from '../utils';
import sleep from '../../src/util/sleep';
import {FullWidthDropdown} from '../../src';
import MenuItem from '../../src/MenuItem';
import {DropdownWrapper} from '../../src/DropdownItems';

describe('<SingleValue>', () => {
  it('dispatches blur event', () => {
    const onBlur = spy();
    const el = mount(<SingleValue value="abc" onBlur={onBlur} />);
    const store = getStore(el);
    store.blur();
    expect(onBlur.callCount, "wasn't focused, so should not call yet").eq(0);
    store.focus();
    expect(onBlur.callCount).eq(0);
    store.blur();
    expect(onBlur.callCount).eq(1);
    store.blur();
    expect(onBlur.callCount).eq(1);
  });

  it('value in store matches initial prop value', () => {
    let el = mount(<SingleValue value="abc" />);
    let store: AssistedSearchStore = getStore(el);
    expect(store.input.value).eq('abc');
  });

  it('value in input DOM node matches store value', () => {
    let el = mount(<SingleValue value="abc" />);
    let input = el.find('input').getDOMNode() as HTMLInputElement;
    expect(input.value).eq('abc');
    expectStoreSynced(el);
  });

  describe('onChange prop', () => {
    let fn = spy();
    let el: ReactWrapper<SingleValueProps>;
    let store: AssistedSearchStore;

    before(() => {
      el = mount(<SingleValue value="" onChange={fn} />);
      store = getStore(el);
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

  describe('dom props', () => {
    it('passes className and style to top component', () => {
      let el = mount(<SingleValue className="hello" style={{color: 'red'}} />);
      let div = el.find('.assisted-search').getDOMNode() as HTMLDivElement;

      expect(div).not.eq(undefined);
      expect(div.classList.contains('hello'), 'should have hello class on top container').eq(true);
      expect(div.style.color).eq('red');
    });
  });

  describe('props.mount', () => {
    it('mounts to body when mount=undefined', async () => {
      let store = new AssistedSearchStore({
        minLength: 0,
        getValues: () => ['A']
      });

      let el = mount(<SingleValue store={store} />);
      store.focus();

      await sleep();
      expectDropdown(store);
      expect(el.find('.assisted-search-base-dropdown')).lengthOf(0);
      expect(document.querySelectorAll('body > div > .assisted-search-dropdown-parent')).lengthOf(1);
      expect(document.querySelectorAll('.assisted-search-dropdown')).lengthOf(1);
      el.unmount();
    });

    it('mounts to an element defined by a function', async () => {
      let store = new AssistedSearchStore({
        minLength: 0,
        getValues: () => ['A']
      });

      let el = mount(<SingleValue store={store} mount={() => document.body} />);
      store.focus();

      await sleep();
      expectDropdown(store);
      expect(el.find('.assisted-search-base-dropdown')).lengthOf(0);
      expect(document.querySelectorAll('body > div > .assisted-search-dropdown-parent')).lengthOf(1);
      expect(document.querySelectorAll('.assisted-search-dropdown')).lengthOf(1);
      el.unmount();
    });

    it('mounts to relative location when mount=false', async () => {
      let store = new AssistedSearchStore({
        minLength: 0,
        getValues: () => ['A']
      });

      let el = mount(<SingleValue mount={false} store={store} />);
      store.focus();

      await sleep();
      expectDropdown(store);

      expect(document.querySelectorAll('body > .assisted-search-dropdown-parent')).lengthOf(0);
      expect(el.getDOMNode().querySelectorAll('.assisted-search-dropdown')).lengthOf(1);
      el.unmount();
    });
  });

  describe('options.getDropdown', () => {
    it('null indicates default behavior', async () => {
      let getDropdown = spy(() => null);
      let store = new AssistedSearchStore({
        getDropdown: getDropdown,
        getValues: () => ['A', 'B']
      }).focus();
      store.setInput('a');
      await sleep();
      expectDropdown(store);

      let el = mount(<SingleValue store={store} />);
      expect(el.find(MenuItem)).lengthOf(2);
      expect(el.find(DropdownWrapper)).lengthOf(1);
    });

    it('false indicates do not render', async () => {
      let getDropdown = spy(() => false);
      let store = new AssistedSearchStore({
        getDropdown: getDropdown,
        getValues: () => ['A', 'B']
      }).focus();
      store.setInput('a');
      await sleep();
      expectDropdown(store);

      let el = mount(<SingleValue store={store} />);
      expect(el.find(MenuItem)).lengthOf(0);
    });

    it('returns custom dropdown in place of items', async () => {
      let getDropdown = spy(() => <FullWidthDropdown>content</FullWidthDropdown>);

      let store = new AssistedSearchStore({
        getValues: () => ['A', 'B'],
        getDropdown: getDropdown
      });
      let el = mount(<SingleValue store={store} />);

      store.focus();
      store.setInput('a');
      expectStoreSynced(el);

      expect(getDropdown.callCount).eq(1);
      await sleep();
      expect(getDropdown.callCount).eq(2);
      expectDropdown(store);
      expectStoreSynced(el);

      let div = el.find('.assisted-search').getDOMNode() as HTMLDivElement;
      expect(div).not.eq(undefined);
      let dd = getInstanceDropdown(el)!;
      expectNotNil(dd, 'dropdown should exist');
      let dropdown = dd.querySelector('.assisted-search-base-dropdown');
      expect(dropdown).not.eq(undefined);
      expect(dropdown!.textContent).eq('content');
    });
  });
});
