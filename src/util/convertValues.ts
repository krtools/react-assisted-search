import {
  DropdownOption,
  Facet,
  SearchEntry,
  ValidDropdownOption,
  ValidDropdownOptions,
  ValidFacet,
  ValidFacets,
  Value
} from '../types';
import {Entry, Input} from '../stores/ComponentStores';

export function newEntry(searchEntry: SearchEntry): Entry {
  return {
    input: newInput(searchEntry.value ? searchEntry.value.value : ''),
    entry: searchEntry
  };
}

export function newInput(value = ''): Input {
  return {value};
}

/**
 * Converts a simple array of strings to SearchEntry's
 * @param {string[]} values
 * @returns {SearchEntry[]}
 */
export function toEntries(values: Array<string | Value | SearchEntry> | null): SearchEntry[] {
  if (values === null) {
    return [];
  }
  if (Array.isArray(values)) {
    return values.map(toEntry);
  }
  return [toEntry(values)];
}

export function toEntry(value: string | Value | SearchEntry): SearchEntry {
  if (typeof value === 'string') {
    return {value: {value: value}};
  }
  if (typeof value.value === 'object') {
    return value as SearchEntry;
  }
  return {
    value: value as Value
  };
}

/**
 * Converts an array of facets (Facet or string) in a a promise resolving to the valid internal facet format.
 * @param opts
 */
export function toFacets(opts: ValidFacets): Promise<Facet[]> {
  if (Array.isArray(opts)) {
    return Promise.resolve(opts.map(toFacet));
  }

  return opts.then(fs => fs.map(toFacet));
}

export function toFacet(facet: ValidFacet): Facet {
  return typeof facet === 'string' ? {value: facet} : facet;
}

/**
 * Converts a handful of dropdown option formats to a fixed internal format
 * @param opts
 */
export function toOptions(opts: ValidDropdownOptions): Promise<DropdownOption[]> {
  if (opts === null) {
    return Promise.resolve([]);
  }

  if (opts instanceof Promise) {
    return opts.then(toOptions);
  }

  if (Array.isArray(opts)) {
    return Promise.resolve(opts.map(toOption));
  }
}

export function toOption(option: ValidDropdownOption): DropdownOption {
  return typeof option === 'string' ? {value: option} : option;
}

/**
 * Convenience method to convert a field:value tuple to a faceted SearchEntry
 * @param facet
 * @param value
 */
export function toFacetValue(facet: string, value: string): SearchEntry {
  return {
    facet: {
      value: facet
    },
    value: {
      value: value
    }
  };
}

/**
 * Converts a value to the Value type required by VisualSearchStore.
 *
 * @param {string | object | null | undefined} val
 * @returns {Value}
 */
export function toValue(val: string | null | undefined | Value): Value {
  if (val !== null && val !== undefined) {
    if (typeof val === 'object') {
      return val as Value;
    }
  }

  return <Value>{
    value: val || ''
  };
}

/**
 * Returns an array of unknown values to usable values by the VisualSearchStore
 *
 * @param {any[]} arr
 * @returns {[]}
 */
export function toValues(arr: any[]): Value[] {
  return arr.map(toValue).filter(identity);
}

/**
 * Basic truthy filter function.
 *
 * @param {any} val
 * @returns {any}
 */
export function identity<T>(val: T): T {
  return val;
}

/**
 * Convenience to create a partial DropdownOption for a value
 * @param value
 * @param label
 */
export function createPartial(value: string, label?: string): DropdownOption {
  return {
    value: value,
    label: label,
    partial: true
  };
}
