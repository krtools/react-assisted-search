import {ReactNode, SyntheticEvent} from 'react';

import AssistedSearchStore from './stores/AssistedSearchStore';
import {AssistedSearchType} from './stores/AssistedSearchType';
import {ConfigCallback} from './types';
import UserEventDispatcher from './stores/KeyboardEventDispatcher';

/**
 * Defines a callback that enables configurations to asynchronously define configurations for
 * specific scenarios in the state for given actions.
 */
export interface ConfigCallback<V, T> {
  (value: V, store: AssistedSearchStore): T | Promise<T>;
}

/**
 * Properties that could affect the outcome of a submit. Most attributes could be derived from the store itself, so
 * this would only include transient properties such as those related to the event that triggered the overrideEntry
 * check
 */
export interface OverrideEntryAttributes {
  isSubmit: boolean;
}

/**
 * The Configuration options for the AssistedSearchStore, and passable to <AssistedSearch> and its variants.
 */
export interface AssistedSearchOptions {
  /**
   * An option to override the default keyboard behavior. This function will run before the default. To stop the
   * default action, return true.
   *
   * @param e
   */
  onKeyDown?: (e: SyntheticEvent<HTMLInputElement>, store: AssistedSearchStore, dispatcher: UserEventDispatcher) => any;

  /**
   * How long to wait in milliseconds before showing the loading dropdown. Only applies if getLoading is specified.
   * Set to false to completely eliminate the loading delay (it will be set synchronously).
   *
   * @default 500
   */
  loadingDelay?: number | false;

  /**
   * An optional parameter to show a loading dropdown
   *
   * @param value The value being searched. This could be a facet or the facet value if in faceted mode
   * @param isFacet returns true if the value being searched is itself searching for a facet
   * @param store the store instance
   */
  getLoading?: (value: string, isFacet: boolean, store: AssistedSearchStore) => ReactNode;

  /**
   * Render an error message to the dropdown when getValues or getFacets  falis
   * @param error
   * @param store
   */
  getError?: (error: any, store: AssistedSearchStore) => ReactNode;

  /**
   * If true, allows users to enter custom facet names in the component
   *
   * @default true
   */
  customFacets?: boolean;

  /**
   * If true, allows users to enter custom values in the component
   *
   * @default true
   */
  customValues?: boolean | AllowCustomValue;

  /**
   * If true, the first item in the dropdown will be selected.
   *
   * @default false
   */
  autoSelectFirst?: boolean | IsAutoSelectFirst;

  /**
   * The minimum number of characters a user must type before the dropdown will be queried and appear with suggestions
   *
   * @default 1
   */
  minLength?: number | GetMinLength;

  /*/!**
   * Returns the available operators for the facet
   *
   * @param {AssistedSearchStore} store
   * @returns {string | Promise<string>}
   *!/
  getOperators?: AsyncConfigOption<string, string[]>;*/

  /**
   * The type of the assisted search we are going to render
   *
   * @default "single"
   */
  type?: AssistedSearchType;

  /** Retrieve facets to use in the provided list dropdown */
  getFacets?: GetFacets;

  /** Retrieve values (or values for a given facet) to use in the provided list dropdown implementation */
  getValues?: GetValues;

  /**
   * Use a custom dropdown, potentially for both getFacets and getValues
   *
   * Return null/undefined to allow default behavior
   * Return false to render nothing
   * Return anything to render that
   */
  getDropdown?: Nullable<GetDropdown>;

  /**
   * A placeholder value for the assisted search. If a string, it will only display when the component has nothing in
   * it. If a function is passed, a value can be displayed at any time.
   */
  placeholder?: string | GetPlaceholder;

  /**
   * Function to determine if a value that a user types into a faceted component is an unfaceted value.
   *
   * For example, 'country' may be a facet, but 'country:Canada' could be its own value that doesn't require a second
   * dropdown.
   *
   * @deprecated use overrideEntry instead
   * @param input
   */
  isStandaloneValue?: Nullable<(input: string) => boolean>;

  /**
   * An optional hook for implementers to programmatically override the entry value to be set from the point of facet
   * entry or facet value entry. Works in single/multiple mode as well.
   *
   *
   * @see AssistedSearchOptions.rewriteFacet if you want only to change the facet value
   * @param input the value currently in the focused input
   * @param facet the current facet, null if we're setting a facet, or we're in multiple/single mode
   * @param attributes stateful information to help to decide how to formulate the entry
   * @param store the store
   */
  overrideEntry?: (
    input: Value,
    facet: Nullable<Facet>,
    store: AssistedSearchStore,
    attributes: OverrideEntryAttributes
  ) => SearchEntry | null | undefined;

  /**
   * Use this to programmatically rewrite any facet submitted to the component from the user
   */
  rewriteFacet?: (facet: Facet, store: AssistedSearchStore) => string | Facet;

  /**
   * Use this to programmatically rewrite any value submitted to the component
   */
  rewriteValue?: Nullable<RewriteValue>;

  /** Use this to override the default dropdown item template. If the function returns null/undefined, the default will be used. */
  optionTemplate?: Nullable<OptionTemplate>;

  /** When true, will not fire event.preventDefault() on the enter key handler */
  allowSubmitEvent?: boolean;
}

/** Function to return a completely custom dropdown */
export interface GetDropdown {
  (items: DropdownOption[], input: string, facet: Facet | null, store: AssistedSearchStore): any;
}

/** Function to return custom content for a dropdown item */
export interface OptionTemplate {
  (item: DropdownOption, facet: Facet | null, store: AssistedSearchStore): any;
}

/** Function to return the minlength of an input based on context */
export interface GetMinLength {
  (input: string, facet: Nullable<string>, store: AssistedSearchStore): number;
}

/**
 * Determines if a value in the input can be a custom value.
 */
export interface AllowCustomValue {
  (facet: Facet | null, store: AssistedSearchStore): boolean;
}

/** Determines if we auto-select the first item, based on the state of the component */
export interface IsAutoSelectFirst {
  (input: string, store: AssistedSearchStore): boolean;
}

/** Rewrites a value before committing it */
export interface RewriteValue {
  (input: Value, facet: Nullable<Facet>, store: AssistedSearchStore): string | Value;
}

/**
 * Function to return the placeholder based on the current state of the component.
 */
export interface GetPlaceholder {
  (field: Nullable<string>, store: AssistedSearchStore): string;
}

export type ValidFacet = Facet | string;

export type ValidFacets = ValidFacet[] | Promise<ValidFacet[]>;

/**
 * The function signature callers must supply to retreive custom dropdowns.
 */
export interface GetFacets {
  /**
   * @param {string} value the current value typed in by the user, use this as a query parameter.
   * @param {AssistedSearchStore} store the current state of the assisted search.
   * @returns {Promise<DropdownOption[]>}a promise to return an array of DropdownOption's
   */
  (value: string, store: AssistedSearchStore): Array<Facet | string> | Promise<Array<Facet | string>>;
}

/**
 * The function signature callers must supply to retrieve results for the dropdown
 */
export interface GetValues {
  /**
   * @param {string} value the current value typed in by the user, use this as a query parameter
   * @param {string | null} facet the current facet selected, null if this is a single-value type
   * @param {AssistedSearchStore} store the current state of the assisted search.
   * @returns {Promise<DropdownOption[]>} a promise to return an array of DropdownOption's
   */
  (value: string, facet: string | null, store: AssistedSearchStore): ValidDropdownOptions;
}

/**
 * The valid values that can be returned by a GetValues callback
 */
export type ValidDropdownOptions = ValidDropdownOption[] | Promise<ValidDropdownOption[]>;

export type ValidDropdownOption = string | DropdownOption;

/**
 * A value selected by the user.
 */
export interface SearchEntry {
  facet?: Nullable<Facet>;

  /** Defaults to ":" */
  operator?: string;

  value: Value;
}

/**
 * A dropdown option available for selection in the assisted search dropdown
 */
export interface DropdownOption {
  /**
   * The actual value.
   */
  value: string;

  /**
   * A custom label for this option. If this is a Value type, this also infers that the value itself CANNOT be edited,
   * Only selected and deleted.
   */
  label?: any;

  /**
   * An optional description that can be placed alongside the option in the dropdown.
   */
  description?: any;

  /**
   * A field to store any additional data about this option that can be used externally.
   */
  data?: any;

  /**
   * If this is set to false while in faceted mode as a return value from getFacets(), then this dropdown option will be
   * treated as a standalone value, and the 2nd dropdown for values will not appear.
   */
  isFacet?: boolean;

  /**
   * If this is set to true, then we are going to treat this item as a partial option that only sets the input but
   * does not commit the value
   *
   * Warning: experimental
   */
  partial?: boolean;
}

/**
 * Represents a value to be put in the dropdown.
 */
export interface Value extends DropdownOption {
  /** A facet, if this is a faceted search, and this a unary value, otherwise facet will be implied */
  facet?: string;

  metadata?: any;
}

/**
 * Represents a facet entry, available to be utilized in the assisted search.
 */
export interface Facet extends DropdownOption {
  /** A custom minimum length for this particular facet */
  minLength?: number;

  /** Defaults to ":" */
  operators?: string[];

  /** Does this facet allow custom values to be entered? Defaults to true, overrides global value */
  customValues?: boolean;

  /** Whether or not this facet type does NOT allow custom values, true by default */
  strict?: boolean;
}

/** The initial values to initialize to the AssistedSearch */
export interface InitialValues {
  /**
   * The value of the input
   */
  value?: string;

  /**
   * The entry values, if this is a multiple or faceted type
   */
  entries?: Array<string | Value | SearchEntry>;
}

/** Type to indicate a value can be null, undefined or some other type */
export type Nullable<T> = T | null | undefined;
