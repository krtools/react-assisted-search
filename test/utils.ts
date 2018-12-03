import AssistedSearchStore from '../src/stores/AssistedSearchStore';
import {expect} from 'chai';
import {Input} from '../src/stores/ComponentStores';
import {ReactWrapper} from 'enzyme';
import {SinonSpy} from 'sinon';
import {SearchEntry, AssistedSearchOptions, Facet} from '../src/types';
import {CHANGE} from '../src/stores/EventTypes';

const NU = [null, undefined];

/**
 * Convenience to make sure a value is not null/undefined
 * @param value
 * @param message
 */
export function expectNotNil(value: any, message: string): void {
  expect(value, message).not.oneOf(NU);
}

/** Convenience to validate an entry's values in a store in a test */
export function expectEntry(
  store: AssistedSearchStore,
  idx: number,
  facet: string | null,
  value: string,
  length?: number
): void {
  if (typeof length === 'number') {
    expect(store.entries.length, `idx (${idx}) should be < length (${store.entries.length})`).greaterThan(idx);
    expect(store.entries, `expecting entries to be length ${length}`).lengthOf(length);
  }
  let entry = store.entries[idx];
  expect(entry, 'entry missing?').not.eq(undefined);
  if (facet === null || facet === undefined) {
    expect(entry.entry.facet, 'expecting standalone value').oneOf(NU);
  } else {
    expect(entry.entry.facet, `entries[${idx}] should have facet`).not.oneOf(NU);
    if (entry.entry.facet) {
      expect(entry.entry.facet.value, `facet should match '${facet}'`).eq(facet);
    }
  }
  expect(entry.entry.value.value, `value should match '${value}'`).eq(value);
  expect(entry.input.value, `input value should match '${value}'`).eq(value);
}

/**
 * Expect a dropdown for a store to NOT have items and to NOT be open.
 * @param store
 */
export function expectNoDropdown(store: AssistedSearchStore): void {
  expect(store.showingDropdown(), `Dropdown should not be showing`).eq(false);
  expect(store.dropdown.items, `Dropdown should not have items in it`).lengthOf(0);
}

/**
 * Expect a dropdown for a store to have items and be open.
 *
 * @param store the store
 * @param selected the indexes we expect to be selected, if [], expect nothing to be selected
 */
export function expectDropdown(store: AssistedSearchStore, selected?: number | number[]): void {
  expect(store.showingDropdown(), `Dropdown should be showing`).eq(true);
  expect(store.dropdown.items.length, `Dropdown should have items in it`).greaterThan(0);
  if (typeof selected === 'number' || Array.isArray(selected)) {
    if (Array.isArray(selected) && selected.length === 0) {
      expect(store.dropdown.selected, "Dropdown shouldn't have items").lengthOf(0);
    }
    (Array.isArray(selected) ? selected : [selected]).forEach(i => {
      expect(store.isSelectedItem(i), `${i} should be selected`).eq(true);
    });
  }
}

export function expectFacetName(store: AssistedSearchStore, name: string, entry?: number): void {
  let facet!: Facet;
  if (typeof entry !== 'number') {
    let active = store.getActiveEntry()!;
    expectNotNil(active, `no index given, there must be an active entry`);
    facet = active.entry.facet!;
    expect(facet, 'facet must exist').not.eq(null);
  }
  expect(facet.value).eq('a');
}

/**
 * Convenience to expect an input to not have a facet candidate
 * @param store
 * @param entry
 */
export function expectNoFacetCandidate(store: AssistedSearchStore, entry?: number): void {
  expectFacetCandidate(store, null, entry);
}

/**
 * Convenience to expect an input to have a particular facet candidate (or none)
 * @param store
 * @param facet
 * @param entry - if not given, assumes main input
 */
export function expectFacetCandidate(store: AssistedSearchStore, facet?: string | null, entry?: number) {
  let input: Input = store.input;
  if (typeof entry === 'number') {
    expect(store.entries[entry], `entries[${entry}] does not exist`).not.eq(undefined);
    input = store.entries[entry].input;
  }
  if (!facet) {
    expect(input.facet, `entries[${entry}] should have no facet candidate`).oneOf(NU);
  } else {
    expect(input.facet && input.facet.value).eq(facet);
  }
}

/**
 * Convenience to expect a value of an entry to be a certain string.
 * @param store
 * @param value
 * @param entry the entry index number, or unentered if main input
 */
export function expectValue(store: AssistedSearchStore, value: string, entry?: number) {
  let input = store.input;
  if (typeof entry === 'number') {
    expect(store.entries[entry], `entry should have ${entry}`).not.eq(undefined);
    input = store.entries[entry].input;
  }
  expect(
    input.value,
    `${input === store.input ? 'main input' : `entries[${entry}].input.value`} should be ${JSON.stringify(value)}`
  ).eq(value);
}

/**
 * Convenience to check the input and CANDIDATE facet of the active input
 * @param store the store
 * @param value the expected value
 * @param candidateFacet the candidate facet value
 */
export function expectInput(store: AssistedSearchStore, value: string, candidateFacet?: string | null) {
  let input = store.input;
  expect(input.value, `expecting input to have value '${value}'`).eq(value);
  if (candidateFacet === null || candidateFacet === undefined) {
    expectNoFacetCandidate(store);
  } else {
    expect(input.facet).not.oneOf(NU);
    expect(input.facet!.value, `expecting facet to be '${candidateFacet}'`).eq(candidateFacet);
  }
}

/**
 * Verifies that the react component's values and text are synced up with what we expect in the state store.
 * @param el
 */
export function expectStoreSynced(el: ReactWrapper) {
  let store = getStore(el);

  let inputs = el.find('input').map(e => e.getDOMNode() as HTMLInputElement);
  let domEntries = el.find('.assisted-search-entry').map(e => e.getDOMNode() as HTMLDivElement);

  if (store.isSingle()) {
    expect(inputs.length, 'single type should only ever have 1 input').eq(1);
    expect(domEntries.length, 'single type should never have DOM representations of entries').eq(0);
  } else {
    expect(inputs.length, `# dom inputs should match input+entries (1+${store.entries.length})`).eq(
      store.entries.length + 1
    );
    expect(domEntries.length, '# dom entries should match store entries').eq(store.entries.length);
    for (let i = 0; i < domEntries.length; i++) {
      let facet = domEntries[i].querySelector('.assisted-search-entry-facet')!;
      expect(facet, 'bad querySelector? dom facet must exist').not.oneOf(NU);

      if (store.isFaceted()) {
        let storeFacet = store.entries[i].entry.facet!;
        expect(storeFacet, `expecting an entry facet @ index ${i}`).not.oneOf(NU);
        expect(facet.textContent, `facet name should match on entries[${i}]`).eq(storeFacet.value);
      } else {
        expect(facet).eq(undefined);
      }
      expect(inputs[i].value, `value should match store on inputs[${i}]}`).eq(store.entries[i].input.value);
    }
  }
}

/**
 * Convenience to expect the store's focused entry to be the given index (or null/undefined if main input)
 * @param store
 * @param entry
 */
export function expectFocus(store: AssistedSearchStore, entry: number = -1) {
  expect(store.getActiveEntryIdx(), `active entry should be ${entry === -1 ? 'main input' : entry}`).eq(entry);
}

/**
 * Convenience to check the arguments of a spy function at a given index.
 * @param fn
 * @param index
 * @param args
 */
export function expectArgs(fn: SinonSpy, index: number, ...args: any[]) {
  let call = fn.getCall(index);
  expect(call, `expecting spy to have at least ${index} calls`).not.eq(undefined);
  for (let i = 0; i < args.length; i++) {
    expect(call.args[i], `expecting args${i} to match`).eq(args[i]);
  }
}

/**
 * Sets up a store to bounce back the value/entries from the onchange to verify store behavior when data
 * binding is in effect.
 *
 * @param options
 */
export function storeWithChangeHandler(options: AssistedSearchOptions = {}): AssistedSearchStore {
  let store = new AssistedSearchStore(options);
  store.addListener(CHANGE, (value: string, entries: SearchEntry[]) => {
    store.setValueAndEntries(value, entries, true);
  });
  store.focus();
  return store;
}

/**
 * Validates the selected items and checks that the items passed in are the only ones selected
 * @param store
 * @param items
 */
export function expectSelected(store: AssistedSearchStore, items: number | number[]) {
  let itemsArr = Array.isArray(items) ? items : [items];
  // basic integrity check
  store.dropdown.selected.forEach((sel, i) => {
    expect(sel, `dropdown.selected[${i}] is undefined`).not.eq(undefined);
  });
  // iterate through items instead for false positive check
  store.dropdown.items.forEach((item, i) => {
    expect(item, `No dropdown items should be undefined (${i})`).not.eq(undefined);
    expect(store.isSelectedItem(i), `Item ${i} should ${itemsArr.includes(i) ? 'NOT ' : ''}be selected`).eq(
      itemsArr.includes(i)
    );
  });
  // check for items that are >= the # of items in dropdown
  itemsArr.forEach(item => {
    expect(item, `item ${item} is out of range`).lt(store.dropdown.items.length);
  });
}

/**
 * Convenience to expect the selectionStart and selectionEnd to match the values given at the entry given
 * @param store
 * @param start
 * @param end
 * @param entry
 */
export function expectCursor(store: AssistedSearchStore, start: number, end: number, entry: number | null): void {
  let input = requireInput(store, entry);
  expect(input.selectionEnd).eq(end);
  expect(input.selectionStart).eq(start);
}

/**
 * Convenience to verify the input's existence with proper error messaging
 * @param store
 * @param entry
 */
function requireInput(store: AssistedSearchStore, entry: number | null): Input {
  let input = entry === null ? store.input : store.entries[entry] && store.entries[entry].input;
  expect(input, `expecting ${entry === null ? 'main input' : `entries[${entry}] to exist`}`).not.oneOf(NU);

  return input;
}

export function getStore(el: ReactWrapper): AssistedSearchStore {
  let store: AssistedSearchStore = (el.instance() as any)['_store'] as AssistedSearchStore;
  expect(store, 'expecting el._store to have the store').instanceOf(AssistedSearchStore);
  return store;
}
