import 'mocha';
import {expect} from 'chai';
import {spy} from 'sinon';

import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {UPDATE} from '../../src/stores/EventTypes';
import sleep from '../../src/util/sleep';
import {toOptions} from '../../src/util/convertValues';

describe('Single Mode', () => {
  it('initializes w/ no-arg constructor, defaults to single mode', () => {
    let store = new AssistedSearchStore();
    expect(store.isSingle()).eq(true);
    expect(store.input.value).eq('');
  });
  
  it('setInput triggers update event', () => {
    let store = new AssistedSearchStore();
    let sp = spy();
    
    store.addListener(UPDATE, sp);
    expect(sp.callCount).eq(0);
    
    store.setInput('def');
    expect(sp.callCount).eq(1);
    
    store.setInput('efg');
    expect(sp.callCount).eq(2);
  });
  
  describe('dropdown behavior', () => {
    let store: AssistedSearchStore;
    before(() => {
      store = new AssistedSearchStore({
        getValues: (v) => v === 'b' ? ['A', 'B', 'C'] : ['A', 'B']
      });
      store.focus();
    });
    
    it('(1) sets dropdown values when changing input value', async () => {
      expect(store.dropdown.items).eql([]);
      store.setInput('A');
      await sleep();
      expect(store.dropdown.items).eql([{value: 'A'}, {value: 'B'}]);
    });
    
    it('(2) blurring input clears dropdown', () => {
      expect(store.dropdown.items).lengthOf(2);
      expect(store.showingDropdown()).eq(true);
      store.blur();
      expect(store.showingDropdown()).eq(false);
    });
    
    it('(3) re-focusing input restores dropdown', async () => {
      store.focus();
      expect(store.showingDropdown(), '(old dropdown items not shown)').eq(false);
      await sleep();
      expect(store.showingDropdown(), 'updated dropdown items').eq(true);
    });
    
    it('(4) changing value does not "flash" the dropdown (clear & reappear)', async () => {
      store.setInput('b');
      expect(store.showingDropdown()).eq(true);
      expect(store.dropdown.items).lengthOf(2);
      
      await sleep();
      expect(store.showingDropdown()).eq(true);
      expect(store.dropdown.items, 'dropdown should have updated values').lengthOf(3);
    });
    
    it('(4) clearing input removes dropdown', async () => {
      // clears value afterwards
      store.setInput('');
      await sleep();
      expect(store.dropdown.items).eql([]);
    });
    
  });
  
  describe('select value', () => {
    let store: AssistedSearchStore;
    before(() => {
      store = new AssistedSearchStore({
        getValues: () => ['A', 'B']
      });
      store.focus();
    });
    
    it('(1) selecting value from dropdown sets entry and input', async () => {
      store.setInput('a');
      await sleep();
      store.selectExact(0);
      
      expect(store.entries).lengthOf(1);
      expect(store.entries[0].entry.value).eql({value: 'A'});
      expect(store.input.value).eq('A');
    });
    
    it('(2) dropdown still functioning after selecting a value', async () => {
      store.setInput('c');
      await sleep();
      expect(store.dropdown.items.length).eq(2);
      store.selectExact(1);
      expect(store.input.value).eq('B');
    });
  });
  
  describe('arrow up/down', () => {
    let store: AssistedSearchStore;
    before(async () => {
      store = new AssistedSearchStore();
      store.dropdown.items = await toOptions(['A', 'B', 'C']);
      store.focus();
    });
    
    it('down arrow to first item', () => {
      store.selectNextItem();
      expect(store.isSelectedItem(0)).eq(true);
    });
    
    it('test next', () => {
      store.selectNextItem();
      expect(store.isSelectedItem(1)).eq(true);
    });
    
    it('test prev to zero', () => {
      store.selectPrevItem();
      expect(store.isSelectedItem(0)).eq(true);
    });
    
    it('test wraps backward', () => {
      store.selectPrevItem();
      expect(store.isSelectedItem(2)).eq(true);
    });
    
    it('test wraps around forward', () => {
      store.selectNextItem();
      expect(store.isSelectedItem(0)).eq(true);
    });
    
    it('forward to last item', () => {
      store.selectNextItem();
      store.selectNextItem();
      expect(store.isSelectedItem(2)).eq(true);
    });
  });
});
