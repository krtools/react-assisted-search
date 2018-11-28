import {
  DropdownOption,
  Facet,
  GetDropdown,
  InitialValues,
  OptionTemplate,
  SearchEntry,
  Value,
  AssistedSearchOptions
} from '../types';

import {CHANGE, SUBMIT, UPDATE} from './EventTypes';
import {newEntry, newInput, toEntries, toEntry, toFacet, toFacets, toOptions} from '../util/convertValues';
import {invokeAll} from '../util/functions';
import {Dropdown, Entry, Input} from './ComponentStores';
import {action, dropdownAction} from '../decorators/action';
import {toValue} from '../util/convertValues';
import {AssistedSearchType} from './AssistedSearchType';

type ChangeSet = [string, SearchEntry[]];

function changed(a: ChangeSet, b: ChangeSet) {
  if (a[0] !== b[0] || a[1].length !== b[1].length) {
    return true;
  }
  let a1 = a[1],
    b1 = b[1];
  for (let i = 0; i < a1.length; i++) {
    let ae = a1[i];
    let be = b1[i];
    if (ae.value.value !== be.value.value || ((ae.facet || be.facet) && ae.facet.value !== be.facet.value)) {
      return true;
    }
  }
  return false;
}

/**
 * Represents the state of the search bar
 */
export default class AssistedSearchStore {
  /**
   * The default options when initializing the store.
   */
  public static DEFAULT_OPTIONS: AssistedSearchOptions = {
    customValues: true,
    customFacets: true,
    type: 'single',
    minLength: 1,
    loadingDelay: 500,
    autoSelectFirst: false
  };

  /** Configures the behavior for this store */
  public options: AssistedSearchOptions;

  /** Represents the state of the "main" input */
  public input: Input = newInput();

  /** Represents the state of the dropdown component */
  public dropdown: Dropdown = {
    selected: [],
    items: []
  };

  /**
   * The selected entries in the input.
   * When in single mode, it only ever has length of 1, and used in the UI if the the value has a label
   */
  public entries: Entry[] = [];

  /** Indicates which input is currently focused */
  public activeElement: Input = null;

  /** Tracking current dropdown lookup to ignore previous promises */
  private _currentLookup: Promise<DropdownOption[]>;

  private _lastValue: ChangeSet;

  private _changeSet(): ChangeSet {
    return [this.input.value, this.getEntries()];
  }

  /**
   * @param {AssistedSearchOptions} options
   * @param {InitialValues} initialValues?
   */
  constructor(options: AssistedSearchOptions = {}, initialValues?: InitialValues) {
    this.options = Object.assign({}, AssistedSearchStore.DEFAULT_OPTIONS, options);

    if (initialValues) {
      this.runInAction(() => {
        if (initialValues.value) {
          this.setInput(initialValues.value);
        }
        if (initialValues.entries) {
          this.setEntries(toEntries(initialValues.entries));
        }
      });
    }
    this._lastValue = this._changeSet();
  }

  /**
   * Set the value of an input (the main input if no second argument passed)
   * @param value
   * @param entry
   */
  @action
  public setInput(value: string, entry?: Entry | number) {
    // changing the input means a keystroke has occurred which triggers a deselection
    this.deselectEntries();
    entry = this._entry(entry);
    let input = entry ? entry.input : this.input;
    input.value = value;
    // TODO reset selected entries -- most eff impl would be flat array on store
    if (input === this.activeElement) {
      this.updateDropdown();
    }
  }

  /**
   * Focus the input of an entry (or just the main input if is nothing passed).
   * @param entry
   * @param clearSelections if true, clear the selectionStart/End
   * @param start set the selectionStart value
   * @param end set the selectionEnd value
   */
  @action
  public focus(
    entry?: Entry | number,
    clearSelections: boolean = true,
    start?: number,
    end?: number
  ): AssistedSearchStore {
    entry = this._entry(entry);
    this.focusInput(entry ? entry.input : this.input, clearSelections, start, end);
    this.deselectEntries();
    return this;
  }

  /** convenience to get an Entry by it value or array index */
  private _entry(entry: Entry | number) {
    return typeof entry === 'number' ? this.entries[entry] : entry;
  }

  /**
   * Bring focus to the main input or an input in one of the entries
   * @param input
   * @param clearSelections
   * @param start
   * @param end
   */
  public focusInput = (input: Input, clearSelections: boolean = true, start?: number, end?: number): void => {
    if (clearSelections) {
      input.selectionStart = input.selectionEnd = null;
    }
    if (typeof start === 'number') {
      input.selectionStart = start;
      input.selectionEnd = end;
    }
    if (this.activeElement !== input) {
      this.activeElement = input;
      this.updateDropdown();
    }
  };

  @action
  public blur = () => {
    this.clearDropdown();
    this.activeElement = null;
  };

  /** Returns true if the component is focused */
  public isFocused(): boolean {
    return this.activeElement !== null;
  }

  /**
   * Returns true if the given entry (or the main input if not present) is focused
   * @param entry the entry to check, if null/undefined is passed, will return true if the main input is active
   */
  public isActiveEntry(entry?: Entry | number) {
    entry = this._entry(entry);
    return this.activeElement === (entry ? entry.input : this.input);
  }

  // does not need to be an action as we don't react to this
  public setInputSelection(start: number, end: number, input: Input = this.activeElement): void {
    if (input) {
      input.selectionStart = start;
      input.selectionEnd = end;
    }
  }

  /**
   * A convenience to set the input selection based on a DOM input element.
   * @param el
   * @param entry
   */
  public setInputSelectionFor(el: HTMLInputElement, entry?: Entry) {
    this.setInputSelection(el.selectionStart, el.selectionEnd, entry ? entry.input : this.activeElement);
  }

  /**
   * Handles the state change for the expected behavior of the "home" key
   */
  public moveToHome(): true | boolean {
    if (this.showingDropdown() && this.hasSelectedItems()) {
      this.setSelectedItems([0]);
      return true;
    }
    const input = this.activeElement;
    const cursorPos = input.selectionStart;
    if (cursorPos === 0 && this.entries.length > 0) {
      this.focus(0, false, 0, 0);
      this.selectEntries([this.entries[0]]);
      return true;
    }
  }

  /**
   * Handles the state change for the expected behavior of the "end" key
   */
  public moveToEnd(): true | boolean {
    if (this.showingDropdown() && this.hasSelectedItems()) {
      this.setSelectedItems([this.dropdown.items.length - 1]);
      return true;
    }
    const input = this.activeElement;
    const cursorPos = input.selectionStart;
    if (cursorPos === input.value.length && this.getActiveEntry()) {
      this.focus(-1, false, 0, 0);
      return true;
    } else {
      this.deselectEntries();
    }
  }

  /**
   * React to the text cursor moving left or right. The selectionStart/End of the active input MUST be updated first.
   * Returns true if an action precludes the default browser behaviour
   */
  public moveLeft(): true | boolean {
    const input = this.activeElement;
    const cursorPos = input.selectionStart;
    const entriesLen = this.entries.length;
    const entry = this.getActiveEntry();
    const entryIdx = this.entries.indexOf(entry);

    // setting to entryLen (max + 1) implies we're on main input
    // this might seem confusing but it makes the math for switching between entries/main input easier

    // TODO: entry selection
    if (cursorPos > 0 || (entryIdx === 0 && entry.selected) || entriesLen === 0 || cursorPos !== input.selectionEnd) {
      return;
    }

    // when selectionStart=0, we select entry first, THEN go back to previous entry
    if (entry && !entry.selected) {
      this.selectEntries([entry]);
      return true;
    }

    const idx = entryIdx === -1 ? entriesLen - 1 : entryIdx - 1;
    this.focus(idx, false, -1, -1);
    return true;
  }

  /**
   * React to the text cursor moving right. The selectionStart/End of the focused input must be updated first.
   * @returns true if the state behavior precludes the default browser behavior
   */
  public moveRight(): true | boolean {
    let input = this.activeElement;

    const cursorPos = input.selectionStart;
    const inputLen = input.value.length;
    const entry = this.getActiveEntry();

    // when caret is not at end of input or on last entry, do default
    if (cursorPos !== inputLen) {
      if (entry && entry.selected) {
        this.deselectEntries();
        return true;
      }
      return;
    }

    const entryLen = this.entries.length;
    const activeEntryIdx = this.entries.indexOf(entry);

    // if we a forward entry to go to, select and focus it, setting cursor to 0
    if (activeEntryIdx > -1 && activeEntryIdx !== entryLen - 1 && !entry.selected) {
      this.runInAction(() => {
        this.focus(activeEntryIdx + 1, false, 0, 0);
        // put this 2nd since focus() blows away entry selection
        this.selectEntries([this.entries[activeEntryIdx + 1]]);
      });
      return true;
    }

    // setting to entryLen (max + 1) implies we're on main input
    // this might seem confusing but it makes the math for switching between entries/main input easier
    const entryIdx = activeEntryIdx === -1 ? entryLen : activeEntryIdx;

    // on last entry, move to the main input
    if (entryIdx === entryLen - 1) {
      this.focus();
    } else {
      // else move to next input
      this.focus(this.entries[entryIdx + 1], true, 0);
    }

    return true;
  }

  /** Maintains the event listeners */
  private _handlers: {[evt: string]: Function[]} = {};

  private _dispatch(event: string, ...args: any[]) {
    invokeAll(this._handlers[event], args.concat([this]));
    invokeAll(this._handlers.all, [event, this]);
  }

  /**
   * Add a listener to the store for an event.
   * @param {string} evt
   * @param {Function} handler
   */
  public addListener(evt: string, handler: Function): void {
    let fns = this._handlers[evt] || (this._handlers[evt] = []);
    fns.push(handler);
  }

  /**
   * Remove a function from the event listeners
   * @param {string} evt
   * @param {Function} handler
   */
  public removeListener(evt: string, handler: Function): void {
    let fns = this._handlers[evt];
    if (fns) {
      fns.splice(fns.indexOf(handler, 1));
    }
  }

  /** isUpdating lock */
  private _u: boolean = false;

  /** isUpdatingDropdown lock */
  private _ud: boolean = false;

  /** Is true if we're suppressing change events */
  private _c: boolean;

  /** True if next update should trigger a submit event */
  private _s: boolean = false;

  /** Dispatch the update event to any listeners. Note that additional changes will trigger a secondary update event */
  private _update = (): void => {
    // change _u and _s first in case callback forces another update
    this._u = false;
    let submitting = this._s;
    this._s = false;
    this._dispatch(UPDATE);

    // change event only triggers if a value/entry changed
    let value = this._changeSet();
    if (!this._c && this._lastValue && changed(value, this._lastValue)) {
      this._dispatch(CHANGE, value[0], value[1]);
    }
    this._lastValue = value;
    if (submitting) {
      this._dispatch(SUBMIT, value[0], value[1]);
    }
  };

  /**
   * Returns the option template from the config options, if there is one.
   * @returns {OptionTemplate | null}
   * TODO: rename OptionTemplate
   */
  public getOptionTemplate(): OptionTemplate | null {
    return this.options.optionTemplate || null;
  }

  /** Returns the custom for the current state of the store, if there is one */
  public getCustomDropdown(): GetDropdown | null {
    return this.options.getDropdown || null;
  }

  /** Returns the currently focused entry, if there is one */
  public getActiveEntry(): Entry {
    return this.entries.find(e => this.activeElement === e.input);
  }

  /** Returns the active entry index, or -1 if none are active/focused */
  public getActiveEntryIdx(): number {
    return this.entries.findIndex(e => this.activeElement === e.input);
  }

  /** Returns the facet of the active entry, if there is one */
  public getActiveFacet(): Facet {
    let input = this.activeElement;
    if (input && input.facet) {
      return input.facet;
    }
    let activeEntry = this.getActiveEntry();
    return activeEntry ? activeEntry.entry.facet : null;
  }

  /** Returns activeFacet().value, if there is one (faceted mode only) */
  public getActiveFacetName(): string | null {
    let facet = this.getActiveFacet();
    return facet ? facet.value : null;
  }

  /**
   * Returns the current placeholder text. This could be a string, react element, null (if there is input), or anything
   * really.
   *
   * @returns {any}
   */
  public placeholder(): any {
    let opts = this.options;
    let input = this.activeElement;
    if (!input || input.value.length) {
      return null;
    }
    if (typeof opts.placeholder === 'function') {
      return opts.placeholder(this.getActiveFacetName(), this);
    } else if (opts.placeholder && !this.input.value.length && !this.entries.length && !this.getActiveFacet()) {
      // by default we don't show placeholder if there is any "content" in the
      // component. to override this, use the function
      return opts.placeholder;
    }
    return null;
  }

  /** Returns the entries */
  public getEntries(): SearchEntry[] {
    return this.entries.map(e => e.entry);
  }

  /** Returns the current input value */
  private getActiveInput(): string {
    let active = this.activeElement;
    return active ? active.value : null;
  }

  /** Reset selection states after blur */
  @action
  private resetSelections(): void {
    // TODO: consistent/performant selection strategy for entries and dropdown items
    this.deselectEntries();
    this.setSelectedItems([]);
  }

  /**
   * Returns true if we're auto selecting the first value.
   * @returns {boolean}
   * @private
   */
  private _autoSelect(): boolean {
    // TODO if nothing is active??
    let input = this.activeElement || this.input;

    let opts = this.options;
    if (typeof opts.autoSelectFirst === 'function') {
      return opts.autoSelectFirst(input.value, this);
    }
    if (typeof opts.autoSelectFirst === 'boolean') {
      return opts.autoSelectFirst;
    }
    return false;
  }

  /** Setting the items in dropdown for either facet or value */
  @action
  private setDropdownItems(opts: DropdownOption[]): void {
    let dropdown = this.dropdown;
    dropdown.items = opts;
    dropdown.selected = this._autoSelect() && opts.length ? [opts[0]] : [];
    this._setDropdownContent();
    this._setLoading(false);
    this._setDropdownError(null);
  }

  @action
  private _setDropdownContent() {
    // custom dropdown handler
    this.dropdown.content = null;
    let getDropdown = this.getCustomDropdown();
    if (getDropdown) {
      this.dropdown.content = () => {
        return getDropdown(this.dropdown.items, this.getActiveInput(), this.getActiveFacet(), this);
      };
    }
  }

  /**
   * Returns true if the item at itemIndex is a selected item in the dropdown
   * @param {number} item
   * @returns {boolean}
   */
  public isSelectedItem(item: DropdownOption | number): boolean {
    return this.dropdown.selected.includes(typeof item === 'number' ? this.dropdown.items[item] : item);
  }

  @action
  public clearSelectedItems(): void {
    this.dropdown.selected = [];
  }

  /**
   * Returns true if the given entry index is currently selected.
   * @param {number} entry
   * @returns {boolean}
   */
  public isSelectedEntry(entry: Entry | number): boolean {
    return this._entry(entry).selected === true;
  }

  /**
   * Set the selected items in the dropdown by their index position
   * @param {number[]} items
   */
  @action
  public setSelectedItems(items: number[]) {
    this.dropdown.selected = items.map(i => this.dropdown.items[i]);
  }

  /**
   * Set the selected items in the dropdown by their index position
   * @param {DropdownOption} item
   * @param submit
   * @param closeDropdown
   */
  @action
  public setSelectedItem(item: number, submit?: boolean, closeDropdown?: boolean): void {
    this.setSelectedItems([item]);
    if (submit) {
      this.setSelection(closeDropdown, submit);
    }
  }

  /**
   * Select the next item in the dropdown, wrapping to the top if necessary.
   */
  @action
  public selectNextItem(): void {
    let dropdown = this.dropdown;
    let item = dropdown.selected.length ? dropdown.items.indexOf(dropdown.selected[0]) + 1 : 0;
    item = item >= dropdown.items.length ? 0 : item;
    this.setSelectedItems([item]);
  }

  /**
   * Select dropdown items (or a single dropdown item) by their exact position, useful for programmatic use.
   * @param {number[]} items
   * @param closeDropdown if true, always closes the dropdown after the action completes
   * @param submit if true, fires a submit event
   */
  @action
  public selectExact(items: number[] | number, closeDropdown: boolean = false, submit?: boolean): void {
    this.setSelectedItems(typeof items === 'number' ? [items] : items);
    this.setSelection(closeDropdown, submit);
  }

  /**
   * Select the previous (above) item in the dropdown, wrapping to the bottom if necessary.
   */
  @action
  public selectPrevItem() {
    let dropdown = this.dropdown;
    let item = dropdown.items.indexOf(dropdown.selected[0]);
    item = item <= 0 || isNaN(item) ? dropdown.items.length - 1 : item - 1;
    this.setSelectedItems([item]);
  }

  /**
   * Select the given entries
   * @param {number[]} entries
   */
  @action
  public selectEntries(entries: Entry[]): void {
    // TODO: flat array or on each property?
    this.entries.forEach(e => {
      e.selected = entries.includes(e);
    });
  }

  @action
  public deselectEntries(): void {
    // TODO should make this a flat array since this would have be to done on every keystroke
    this.entries.forEach(e => {
      e.selected = false;
    });
  }

  /**
   * Returns true if items are selected in the dropdown
   * @returns {boolean}
   */
  public hasSelectedItems(): boolean {
    return this.dropdown.selected.length !== 0;
  }

  /**
   * Returns the minimum length of the input before the dropdown activates.
   * @returns {number}
   */
  private minLength(): number {
    let minLength = this.options.minLength;

    let currentFacet = this.getActiveFacet();

    if (typeof minLength === 'number') {
      return minLength;
    } else if (typeof minLength === 'function') {
      return minLength(this.input.value, currentFacet && currentFacet.value, this);
    } else if (currentFacet && currentFacet.minLength >= 0) {
      return currentFacet.minLength;
    }
    return 1;
  }

  /**
   * Perform a delete of entries, or the active facet for the main input, if needed. selectionStart/End must be updated
   * before calling. (handles action for backspace key in UI)
   */
  public deleteBehind(): true | void {
    let input = this.activeElement;
    // If cursor != 0, or text selected, delete characters
    // If no entry behind us, do nothing
    let selected = this.getSelectedEntries();
    if (selected.length) {
      this._deleteSelectedEntries();
      return;
    }

    if (input.selectionStart > 0 || input.selectionStart !== input.selectionEnd) {
      return;
    }

    // clearing candidate facet
    if (input === this.input && input.facet) {
      this.runInAction(() => {
        this.clearCurrentFacet();
        this.focus();
      });
      return true;
    }

    // cursor = 0 and no text selected, delete entry behind us
    let activeEntry = this.getActiveEntry();
    let entryIdx = this.entries.indexOf(activeEntry);
    if (this.entries.length) {
      this.runInAction(() => {
        let idx = entryIdx === -1 ? this.entries.length - 1 : entryIdx;
        if (!activeEntry) {
          this.focus(this.entries[idx]);
        } else {
          this.selectEntries([this.entries[idx]]);
          this.deleteSelectedEntries();
          this.focus(entryIdx === 0 ? null : this.entries[entryIdx - 1]);
        }
      });
      return true;
    }
  }

  public deleteAhead(): true | void {
    let input = this.activeElement;
    let len = input.value.length;

    // if entries selected, delete them
    let entries = this.getSelectedEntries();
    if (entries.length) {
      this._deleteSelectedEntries();
      return true;
    }

    // when not at end of input or on main input, do nothing (del does not act like backspace)
    if (input.selectionStart !== len || input.selectionStart !== input.selectionEnd || input === this.input) {
      return;
    }

    let entryIdx = this.entries.indexOf(this.getActiveEntry());
    // also do nothing if on last entry -- TODO: should we delete main input value?
    if (entryIdx === this.entries.length - 1) {
      return;
    }
    // delete the next entry
    this.deleteEntries([entryIdx + 1]);
    return true;
  }

  @action
  public deleteEntries(entries: Array<Entry | number>) {
    entries = entries.map(e => this._entry(e));
    this.entries = this.entries.filter(e => !entries.includes(e));
  }

  // TODO: name discrepancy between getSelectedEntries and getEntries (different return types)
  public getSelectedEntries(): Entry[] {
    return this.entries.filter(e => e.selected);
  }

  @action
  public clearCurrentFacet(): void {
    this.input.facet = null;
    if (this.isActiveEntry()) {
      this.updateDropdown();
    }
  }

  /** Removes the entries that are currently selected */
  public deleteSelectedEntries(): void {
    if (this.entries.every(e => !e.selected)) {
      return;
    }
    this._deleteSelectedEntries();
  }

  @action
  private _deleteSelectedEntries() {
    let filtered = this.entries.filter(e => !e.selected);
    // focus() clears selection state, get filtered set beforehand
    if (this.entries.includes(this.getActiveEntry())) {
      this.focus();
    }
    this.entries = filtered;
    this.updateDropdown();
  }

  /** Returns the single value represented by the assisted search component. */
  public getSingleValue(): Value {
    if (!this.customValues(null)) {
      let entry = this.entries[0];
      return entry ? entry.entry.value : null;
    }
    return {value: this.input.value};
  }

  /** Returns true if we're currently displaying the dropdown */
  public showingDropdown(): boolean {
    let input = this.activeElement;
    if (!input) {
      return false;
    }

    let dropdown = this.dropdown;

    return (
      typeof dropdown.content === 'function' ||
      dropdown.error ||
      (dropdown.loadingDropdown !== undefined && dropdown.loadingDropdown !== null) ||
      (dropdown.items &&
        dropdown.items.length > 0 && //
        // min length requirement (won't search either)
        input.value.length >= this.minLength())
    ); //
    // in single mode suppress dropdown immediately after submitting last value
    // && (!isSingle || (!this._lastInput || this.input !== this._lastInput));
    // FIXME: this has an issue in single mode for custom values where currently typed in value never shows dropdown
    // items && (!this.isSingle() || (!value || value.value !== this.input))
  }

  /**
   * Change the value of an existing entry.
   * @param entry
   * @param value
   */
  @action
  public setEntryValue(entry: Entry | number, value: string | Value): void {
    entry = this._entry(entry);
    this.deselectEntries();
    if (typeof value === 'string') {
      entry.input.value = value;
      entry.entry.value = toValue(value);
    } else {
      entry.entry.value = value;
      entry.input = newInput(value);
    }
    if (this.isActiveEntry(entry)) {
      this.updateDropdown();
    }
  }

  /**
   * Returns the value appropriate for this search type.
   * @returns {Value | Value[] | SearchEntry[]}
   */
  public getValueForType(): Value | Value[] | SearchEntry[] {
    if (this.isSingle()) {
      return this.getSingleValue();
    } else if (this.isFaceted()) {
      return this.getEntries();
    }
    return this.getValues();
  }

  /**
   * Set the value for the single-value component
   * @param value
   */
  @action
  public setValue(value: string | Value | null): void {
    if (value === null || value === '') {
      this.entries = [];
      this.setInput('');
    } else {
      let searchEntries = toEntries([value]);
      this.entries = value === null ? [] : searchEntries.map(e => newEntry(e));
      this.setInput(searchEntries[0].value.value);
    }
  }

  /**
   * Set the input (and entry) using the input. Works a little differently than multi/faceted since the input takes the
   * place of the entry.
   *
   * @param value
   */
  @action
  public setSingleValue(value: string) {
    if (this.customValues(null)) {
      this.setValue(value);
    } else {
      this.setEntries([]);
      this.setInput(value);
    }
  }

  /** Make changes without triggering a change event */
  public noChange(fn: Function) {
    let c = this._c;
    this._c = true;
    fn();
    this._c = c;
  }

  /** Change the value of the main input */
  @action
  public setEntries(entries: SearchEntry[] | null): void {
    let idx = this.getActiveEntryIdx();
    this.entries = entries === null ? [] : entries.map(e => newEntry(e));
    if (~idx) {
      this.activeElement = idx < entries.length ? this.entries[idx].input : this.input;
      this.focus(idx);
    }
  }

  /**
   * Returns the values for this multivalue component
   * @returns {Value[]}
   */
  public getValues(): Value[] {
    // TODO verify it's okay to just get [0]
    return this.entries.map(f => f.entry.value);
  }

  /**
   * Returns a condensed version of the facet values, in object key:[values] format.
   * @returns {object}
   */
  public getFacetValues(): {[key: string]: any[]} {
    let map = {} as {
      [key: string]: any;
    };

    this.entries.forEach(entry => {
      let searchEntry = entry.entry;
      let values = map[searchEntry.facet.value] || (map[searchEntry.facet.value] = []);
      if (searchEntry.value) {
        values.push(searchEntry.value.value);
      }
    });
    return map;
  }

  /**
   * Remove an entry from the list, by its actual value.
   *
   * @param {SearchEntry} entry
   * @param {boolean} [deleteForward] if set to true, and this is the active entry, focus will move to the next entry
   *   instead of the previous one.
   */
  public removeEntry = (entry: Entry, deleteForward?: boolean): void => {
    let entries = this.entries;
    let idx = entries.indexOf(entry);
    if (idx === -1) {
      return;
    }
    this._removeEntries([idx], deleteForward);
  };

  @action
  public clearDropdown(): void {
    // clear pending to prevent dropdown from popping up again
    this._currentLookup = null;
    this._setLoading(false);
    this._setDropdownError(null);
    Object.assign(this.dropdown, {
      items: [],
      selected: [],
      content: null,
      loading: false
    });
  }

  /**
   * Add the facet value, either from the selection or from the input, if applicable, or sets the
   * standalone value determined by isFacet | options.isStandaloneValue()
   * @returns true if an entry was added as a result (implies we need to submit). If a string, that is the facet candidate set, which
   * implies we NEVER submit
   * @private
   */
  @action
  private _setCandidateFacet(input: Input = this.activeElement, selected: DropdownOption, letOverride = true): void | true | string {
    let opts = this.options;
    let value: string | Value = input.value;
    // this comes before checking selected items, manually typed in value has precedence

    // TODO: this is quite the hack to bypass override w/ tab, should just pass isSubmit to overrideEntry
    if (opts.overrideEntry && letOverride) {
      let entry = opts.overrideEntry(selected || {value}, null, this);
      if (entry) {
        this._addEntry(entry);
        return true;
      }
    }

    if (
      selected &&
      ((opts.isStandaloneValue && opts.isStandaloneValue(selected.value)) || selected.isFacet === false)
    ) {
      this._addEntry(toEntry(selected));
      // TODO: de-dupe clearing input value
      return true;
    } else if (!selected && opts.isStandaloneValue && opts.isStandaloneValue(value)) {
      // add value
      if (this.options.rewriteValue) {
        value = this.options.rewriteValue(toValue(value), input.facet, this);
      }
      this._addEntry({value: toValue(value)});
      return true;
    } else {
      // just setting the facet candidate from the selected item in the dropdown
      let facet: Facet = selected;
      if (!facet && value && this.options.customFacets) {
        facet = this._getRewrittenFacet(value);
      }
      if (facet) {
        input.facet = facet;
        input.value = '';
        return facet.value;
      }
    }
  }

  /**
   * Update the dropdown state based on input, currentFacet, etc
   * @param force set to true to run regardless of if another updateDropdown call is pending
   * @private
   */
  public updateDropdown(force?: boolean): void {
    let ud = this._ud;
    if (!force && ud) {
      return;
    }
    this._ud = false;

    // always reset selections this after an update
    // todo actionify this and loading
    this.setSelectedItems([]);

    let input = this.getActiveInput();
    if (input === null) {
      return;
    }

    if (input.length >= this.minLength()) {
      // make call for items
      let opts = this.options;

      // only do facet in facet mode and when we don't have a current facet
      let currentFacet = this.getActiveFacet();

      this._setDropdownContent();
      if (this.isFaceted() && !currentFacet) {
        if (opts.getFacets) {
          this._setLoading(true);
          let promise = (this._currentLookup = toFacets(opts.getFacets(input, this)));
          promise.then(
            opts => {
              if (promise === this._currentLookup) {
                return this.setDropdownItems(opts);
              }
            },
            err => {
              this._setDropdownError(err);
            }
          );
        }
      } else {
        if (opts.getValues) {
          let facetValue = currentFacet && currentFacet.value;
          this._setLoading(true);
          let lookup = (this._currentLookup = toOptions(opts.getValues(input, facetValue, this)));
          lookup.then(
            opts => {
              if (lookup === this._currentLookup) {
                return this.setDropdownItems(opts);
              }
            },
            err => {
              this._setDropdownError(err);
            }
          );
        }
      }
    } else {
      this.clearDropdown();
    }
  }

  /**
   * Add either the selected value(s) or the value in the input based on the context.
   * Only applicable in faceted or multiple mode
   * @private
   */
  @action
  private _addValues(value: Value, submit?: boolean): void {
    // TODO: break by type, i think
    let activeFacet = this.getActiveFacet();
    // if no selected items, take the input as the value
    if (!value) {
      // if we don't support custom values and there is nothing selected in the dropdown, this is a no-op
      if (!this.customValues(activeFacet)) {
        return;
      }
      let inputValue: string | Value = this.input.value;
      value = toValue(inputValue);
    }

    // when on the main input, remove the candidate facet
    if (this.activeElement === this.input) {
      // don't use removeCurrentFacet() because it triggers a dropdown change
      this.input.facet = null;
      if (!this.isSingle()) {
        this.input.value = '';
      }
    }

    let entry: SearchEntry = {
      facet: activeFacet,
      value: this._getRewrittenValue(value, activeFacet)
    };

    if (this.options.overrideEntry) {
      let override = this.options.overrideEntry(value, activeFacet, this);
      if (override) {
        entry = override;
      }
    }

    this._addEntry(entry, submit);
  }

  private _getRewrittenValue(value: Value | string, facet?: Facet): Value {
    value = toValue(value);
    if (this.options.rewriteValue) {
      let rewritten = this.options.rewriteValue(value, facet, this);
      return toValue(rewritten || value);
    }
    return value;
  }

  private _getRewrittenFacet(facet: Facet | string): Facet {
    facet = toFacet(facet);
    if (this.options.rewriteFacet) {
      let rewritten = this.options.rewriteFacet(facet, this);
      return toFacet(rewritten || facet);
    }
    return facet;
  }

  @action
  private _addEntry(entry: SearchEntry, submit?: boolean): void {
    if (!this.isSingle()) {
      this.entries.push(newEntry(entry));
    } else {
      this.entries = [newEntry(entry)];
    }
    if (submit !== false) {
      this.submit();
    }
  }

  /** Cancel the current facet, if there is one */
  @dropdownAction
  public removeCurrentFacet(): void {
    this.input.facet = null;
  }

  /** Delete the previous entry from we are currently at */
  @dropdownAction
  public deletePrevEntry(): void {
    // TODO: .without() function
    let idx = this.entries.length - 1;
    let activeEntry = this.getActiveEntry();
    if (!activeEntry) {
      idx = this.entries.indexOf(activeEntry);
    }
    let entries = this.entries;
    entries.splice(idx, 1);
  }

  /**
   * Enter a value into the active input and select it, this is the "manual" version of setSelection, (which works with dropdown values)
   * @param value
   * @param closeDropdown
   * @param submit
   */
  // implicitly an action since it only calls one method which is an action
  public selectValue(value: string | Value, closeDropdown: boolean = false, submit: boolean = true): void {
    this._select(toValue(value), closeDropdown, submit);
  }

  /**
   * Enter the current selection of the dropdown into a value, or the new current facet, if appropriate.
   * @param closeDropdown
   * @param submit
   */
  // implicitly an action since it only calls one method which is an action
  public setSelection(closeDropdown: boolean = false, submit: boolean = true): void {
    this._select(this.dropdown.selected[0], closeDropdown, submit);
  }

  /**
   * Enter the current selection of the dropdown into a value, or the new current facet, if appropriate.
   * @param selected
   * @param closeDropdown
   * @param submit
   */
  @action
  private _select(selected: DropdownOption, closeDropdown: boolean = false, submit: boolean = true): void {
    // in single mode, with custom values, we simply change the value of the input rather than having the value in a
    // "bubble"
    if (selected && selected.partial && this.activeElement) {
      this.activeElement.value = selected.value;
      this.clearDropdown();
      return;
    }

    let doSubmit = submit;
    if (this.isSingle()) {
      if (selected) {
        // this appears to be overcome by _addValues
        this.input = newInput(selected);
      }
      this.entries = [];
      this._addValues(selected, submit);
    } else {
      let activeEntry = this.getActiveEntry();
      if (activeEntry) {
        // TODO: add support for candidate facets of existing standalone entries
        this.setEntryValue(activeEntry, selected || activeEntry.input.value);
        // set active back to main input when changing the selection
        this.focus();
      } else {
        if (this.isFaceted() && !this.getActiveFacet()) {
          let candidate = this._setCandidateFacet(this.activeElement, selected, submit === true);
          if (typeof candidate === 'string') {
            // we set candidate, suppress submit
            doSubmit = false;
          }
          if (candidate) {
            // when non-undefined, we changed a value, otherwise it means there was nothing to submit
            this.input.value = '';
          }
        } else {
          this._addValues(selected, submit);
        }
      }
    }

    if (doSubmit) {
      this.submit();
    }
    this.clearDropdown();
    this.focus();
    // close dropdown on enter, but not when the candidate facet is being set
    if (!closeDropdown || (this.activeElement === this.input && this.input.facet)) {
      this.updateDropdown();
    }
  }

  /** Fire a submission event after the current transaction terminates */
  @action
  public submit(): void {
    this._s = true;
  }

  @action
  private _removeEntries(idxs: number[], deleteForward?: boolean): void {
    let activeIdx = this.entries.indexOf(this.getActiveEntry());
    let entries = this.entries.filter((e, i) => !idxs.includes(i));

    // fix active entry if affected
    if (idxs.includes(activeIdx)) {
      let newIdx = Math.min(entries.length - 1, Math.max(0, activeIdx + (deleteForward ? 0 : -1)));
      // if deleting forward on last entry or backward and we now have no more entries, set focus to main input
      if (newIdx === this.entries.length) {
        this.focus();
      } else {
        // newIdx points to a valid entry
        this.focus(entries[newIdx]);
      }
    }
    this.entries = entries;
  }

  public setValueAndEntries(value: string | Value, entries: Array<string | Value | SearchEntry>, silent?: boolean) {
    return silent ? this.noChange(() => this._setValue(value, entries)) : this._setValue(value, entries);
  }

  @action
  private _setValue(value: string | Value, entries: Array<string | Value | SearchEntry>) {
    if (value !== undefined) {
      this.input.value = typeof value === 'string' ? value : value.value;
      if (this.isSingle()) {
        this._addEntry(toEntry(value), false);
      }
    }
    if (entries !== undefined) {
      this.setEntries(toEntries(entries));
    }
  }

  // doesn't need to be an action because we do not listen to changes for this.
  /**
   * Clears the selected text state of the currently focused input
   * @param input
   */
  public clearSelection(input: Input = this.activeElement): void {
    if (input) {
      input.selectionStart = input.selectionEnd = null;
    }
  }

  /**
   * Run a series of changes to the store, then commit the result as an update to the component. Will not trigger a
   * double update if the upper layer is also inside of an action.
   * @param fn
   * @param updateDropdown
   */
  public runInAction<T>(fn: (...args: any[]) => T, updateDropdown?: boolean): T {
    // top-level action triggers single update call
    let updating = this._u;
    let updatingDropdown = this._ud;
    if (updateDropdown) {
      this._ud = true;
    }
    this._u = true;
    let val = fn();
    if (!updating) {
      this._update();
    }
    if (updateDropdown && !updatingDropdown) {
      this.updateDropdown(true);
    }
    return val;
  }

  customValues(facet: Facet): boolean {
    if (typeof this.options.customValues === 'function' && facet) {
      return this.options.customValues(facet, this);
    }
    return this.options.customValues !== false;
  }

  public type(): AssistedSearchType {
    return this.options.type || 'single';
  }

  public isSingle(): boolean {
    return this.type() === 'single';
  }

  public isMultiple(): boolean {
    return this.type() === 'multiple';
  }

  public isFaceted(): boolean {
    return this.type() === 'faceted';
  }

  // below is loading stuff -- try to make this more elegant

  @action
  private _setLoading(loading: boolean) {
    clearTimeout(this._loadingDropdownTo);
    this.dropdown.loading = loading;
    // don't trigger update if we don't have to
    if (this.dropdown.loadingDropdown) {
      this.runInAction(() => {
        this.dropdown.loadingDropdown = null;
      });
    }

    let opts = this.options;
    let getLoading = opts.getLoading;
    if (loading && getLoading) {
      // todo params
      this.setLoadingDropdown('', false);
    }
  }

  /**
   * Returns true if the dropdown is currently waiting on results from getValues() or getFacets()
   */
  public isDropdownLoading(): boolean {
    return !!this.dropdown.loading;
  }

  // timer for delayed display of loading dropdown
  _loadingDropdownTo?: number;

  setLoadingDropdown(value: string, isFacet: boolean) {
    // is loading delay
    let doGetLoading = () => {
      this.runInAction(() => {
        this.dropdown.loadingDropdown = this.options.getLoading(value, isFacet, this);
      });
    };
    let loadingDelay = this.options.loadingDelay;
    if (typeof loadingDelay === 'number') {
      this._loadingDropdownTo = window.setTimeout(doGetLoading, loadingDelay);
    } else {
      doGetLoading();
    }
  }

  @action
  _setDropdownError(error: any) {
    this._setLoading(false);
    let rendered = error ? (this.options.getError ? this.options.getError(error, this) : null) : null;
    this.dropdown.error = rendered;
  }
}
