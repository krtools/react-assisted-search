import * as React from 'react';

import {orderBy, get} from 'lodash';

import countryList from 'country-list';
import us from 'us';
import sleep from '../src/util/sleep';
import USMapDropdown from './dropdowns/USMap/USMapDropdown';
import {FullWidthDropdown} from '../src/dropdowns/FullWidthDropdown';
import {DropdownOption, Facet, Value} from '../src/types';
import AssistedSearchStore from '../src/stores/AssistedSearchStore';

const countries = countryList();

/** For UI testing only */
export const LOOKUP_DELAY = 100;

/**
 * Looks up countries and returns ISO2 Codes and names
 * @param {string} value
 * @returns {Promise<Array>}
 */
export async function lookupCountries(value: string): Promise<DropdownOption[]> {
  await sleep(LOOKUP_DELAY);
  return findCountries(value).map(country => {
    return {
      value: country.name
    };
  });
}

export interface Country {
  name: string;
  code: string;
}

function findCountries(value: string): Country[] {
  let q = value.toLowerCase().trim();
  let countrys = countries.getData().filter(country => {
    return country.name.toLowerCase().includes(q) || country.code.toLowerCase().includes(q);
  });

  return defaultOrder(countrys, 'name', value);
}

/**
 * Looks up US states and returns them to an assisted search component.
 * @param {string} value
 * @returns {Promise<Array>}
 */
export async function lookupStates(value: string): Promise<Array<Value>> {
  await sleep(LOOKUP_DELAY);
  return findStates(value).map(state => {
    return {
      value: state.name,
      metadata: state
    };
  });
}

export interface State {
  name: string;
  abbr: string;
}

/**
 * Returns an array of Assisted Search Value's of states matching the querys
 * @param value
 * @returns {Value[]}
 */
export function findStates(value: string): State[] {
  let q = value.toLowerCase().trim();
  let states = us.STATES.filter(state => {
    return state.name.toLowerCase().includes(q) || state.abbr.toLowerCase().includes(q);
  });

  return defaultOrder(states, 'name', value);
}

/**
 * Order the array by it's relative "closeness" to the query, then by alpha
 *
 * @param {object[]} arr
 * @param {string} key
 * @param {string} query
 * @returns {object[]}
 */
export function defaultOrder<T>(arr: T[], key: string, query: string): T[] {
  // @ts-ignore
  return orderBy(
    arr,
    [s => numMatchingFirstChars(query, get(s, key, '')), s => get(s, key, '').toLowerCase()],
    ['desc', 'asc']
  );
}

/**
 * Returns the number of matching characters (or put another way, the first character index that does NOT match), or -1
 * if the same strings.
 *
 * @param {string} value1
 * @param {string} value2
 * @returns {number}
 */
export function numMatchingFirstChars(value1: string, value2: string): number {
  let str = value1.toLowerCase();
  let str2 = value2.toLowerCase();
  for (let i = 0; i < str.length; i++) {
    let si = str[i];
    let s2i = str2[i];
    if (!si || !s2i || si !== s2i) {
      return i;
    }
  }
}

export const COUNTRY = 'country';
export const STATE = 'state';
export const DATE = 'date';

/**
 * Get filtered facet list
 *
 * @param {string} value
 * @returns {Object[]}
 */
export async function getFacets(value) {
  await sleep(LOOKUP_DELAY);
  let filtered = [COUNTRY, STATE]
    .filter(s => {
      return s.includes(value.toLowerCase());
    })
    .map(s => {
      return {value: s};
    });

  return defaultOrder(filtered, 'value', value);
}

/**
 * Get filtered value list, based on facet
 * @param value
 * @param facet
 * @returns {Promise<Array>}
 */
export async function getValues(value: string, facet: string) {
  // this function being async is overkill, but here to emphasize that getValues must return a promise.
  switch (facet) {
    case COUNTRY:
      return await lookupCountries(value);
    case STATE:
      return await lookupStates(value);
    default:
      throw new Error('invalid facet on value lookup, got back ' + facet);
  }
}

/**
 * Returns state values, using the code as the value, and the name as the label
 * @param {string} q
 * @returns {Promise<any[]>}
 */
export async function lookupWithStateCodes(q) {
  let states = findStates(q);
  return states.map(state => {
    return {
      value: state.abbr,
      label: state.name
    };
  });
}

/**
 * Return the appropriate dropdown
 * @param items
 * @param input
 * @param facet
 * @param store
 */
export function getDropdown(items: DropdownOption[], input: string, facet: Facet, store: AssistedSearchStore) {
  if (!facet) {
    return null;
  }
  switch (facet.value) {
    case STATE:
      return (
        <FullWidthDropdown style={{padding: '5px 5px'}}>
          <USMapDropdown store={store}/>
        </FullWidthDropdown>
      );
    default:
      return null;
  }
}
