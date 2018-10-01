import {DropdownOption, SearchEntry, Facet} from '../types';

/** Contains all the parameters that the store needs to control the inputs with */
export interface Input {
  /** The candidate facet, meant for the "main" input only */
  facet?: Facet;

  /**
   *  The text cursor position of the active input at the point of KeyboardEvent's, not considered up-to-date otherwise.
   *  This value is cleared when the DOM input consumes it.
   */
  selectionStart?: number;

  /**
   *  The text cursor position of the active input at the point of KeyboardEvent's, not considered up-to-date otherwise.
   *  This value is cleared when the DOM input consumes it.
   */
  selectionEnd?: number;

  /** The string value of the input itself, synced with the view */
  value: string;
}

/** Represents an editable value that has been selected and committed to the component */
export interface Entry {
  selected?: boolean;

  /** The representation of the entry's input component */
  input?: Input;

  /** The search entry data itself containing the submitted value */
  entry?: SearchEntry;
}

export interface Dropdown {
  /** The list of items currently in the dropdown */
  items: DropdownOption[];

  /** The list of items currently selected in the dropdown */
  selected: DropdownOption[];

  /** Is non-null/undefined if content is loading, and there is a custom loading component/value to display */
  loading?: any;

  loadingDropdown?: any;

  /** Is non-null/undefined if content is loading, and there is a custom loading component/value to display */
  error?: any;

  /** A custom dropdown container supplied by the user for selecting values, usually undefined */
  content?: any;
}
