import * as React from 'react';

import AssistedSearchStore from './stores/AssistedSearchStore';
import UserEventDispatcher from './stores/KeyboardEventDispatcher';

import Container from './Container';
import AssistedInput from './AssistedInput';
import VisualEntry from './VisualEntry';

import {CHANGE, SUBMIT, UPDATE} from './stores/EventTypes';
import {AssistedSearchOptions, SearchEntry, Value} from './types';
import {DropdownWrapper} from './DropdownItems';
import {Pending} from './Pending';
import {Entry} from './stores/ComponentStores';
import {delegate} from './util/functions';
import {omit} from './util/convertValues';
import {MountedDropdown} from './MountedDropdown';

export interface AssistedSearchProps {
  /**
   * The value of the "main" input
   */
  value?: string | Value;

  /**
   * The committed entries. When in single mode, there is only ever one entry,
   * and it is kept in sync with props.value
   */
  entries?: Array<string | SearchEntry>;

  /**
   * Configuration of the components behavior
   */
  options?: AssistedSearchOptions;

  /**
   * Triggered on all state changes to the component.
   *
   * Warning: do not use this to trigger a state change a re-render a
   * parent component as this could cause an infinite loop
   * @param type
   * @param store
   */
  onAll?: (type: string, store: AssistedSearchStore) => any;

  /**
   * Fires when the value of the component changes.
   * @param val
   * @param entries
   * @param store
   */
  onChange?: (val: string, entries: SearchEntry[], store: AssistedSearchStore) => any;

  /**
   * Fires when a user explicitly selects a value from the dropdown, or when they hit the enter key
   * @param val
   * @param entries
   * @param store
   */
  onSubmit?: (val: string, entries: SearchEntry[], store: AssistedSearchStore) => any;

  /**
   * A custom-configured store component. This store is configured automatically when using one of the provided
   * react components for each mode.
   */
  store?: AssistedSearchStore;

  /**
   * An element to mount the dropdown onto.
   */
  mount?: HTMLElement | false;

  [key: string]: any;
}

const OMITTED_PROP_KEYS = ['value', 'entries', 'options', 'onAll', 'onChange', 'onSubmit', 'store', 'mount'];

/**
 * The main container and entry point.
 *
 * @extends React.Component<AssistedSearchProps>
 */
export default class AssistedSearch extends React.Component<AssistedSearchProps> {
  store: AssistedSearchStore;

  /** Handles keyboard events */
  dispatcher: UserEventDispatcher;

  _update = () => {
    this.forceUpdate();
  };

  mountRef?: MountedDropdown;

  private _setMount = (el: MountedDropdown) => {
    this.mountRef = el;
  };

  /** Returns the mounted element, or null if this is a relative mount */
  getMountRef = (): (HTMLDivElement | null) => {
    return this.mountRef ? this.mountRef.rel || null : null;
  };

  constructor(props: AssistedSearchProps) {
    super(props);
    let store = this.props.store;
    if (!store) {
      store = new AssistedSearchStore(props.options || {});
    }

    store.setValueAndEntries(this.props.value, this.props.entries, true);
    this.store = store;
    this.store.addListener(UPDATE, this._update);
    this.store.addListener(CHANGE, delegate(() => this.props.onChange));
    this.store.addListener(SUBMIT, delegate(() => this.props.onSubmit));
    if (this.props.onAll) {
      this.store.addListener('all', this.props.onAll);
    }
    this.dispatcher = new UserEventDispatcher(this.store);
  }

  componentWillReceiveProps(nextProps: AssistedSearchProps) {
    this.store.setValueAndEntries(nextProps.value, nextProps.entries, true);
  }

  private _focus = () => {
    if (!this.store.activeElement) {
      this.store.focus();
    }
  };

  componentWillUnmount() {
    this.store.removeListener(UPDATE, this._update);
  }

  render() {
    let store = this.store;

    // TODO: move entries into own component, need an EntryContainer
    let entries;
    if (store.entries) {
      entries = store.entries.map((entry: Entry, i) => {
        return (
          <VisualEntry
            key={i}
            entry={entry}
            onRemove={this.store.removeEntry}
            focused={this.store.isActiveEntry(entry)}
            selected={store.isSelectedEntry(entry)}
            store={store}
          />
        );
      });
    }

    let pending = store.input.facet ? <Pending facet={store.input.facet}/> : null;

    let {style, className, ...props} = this.props;

    let input = (
      <AssistedInput
        {...omit(props, OMITTED_PROP_KEYS)}
        input={store.input}
        store={store}
        placeholder={store.placeholder()}
      >
        {entries}
        {pending}
      </AssistedInput>
    );

    let dropdown = store.showingDropdown() ? <DropdownWrapper store={store}/> : null;
    if (dropdown && this.props.mount !== false) {
      dropdown = (
        <MountedDropdown mount={this.props.mount || document.body} ref={this._setMount}>
          {dropdown}
        </MountedDropdown>
      );
    }

    return (
      <Container
        getDropdownEl={this.getMountRef}
        style={style}
        className={className}
        onKeyDown={this.dispatcher.handler}
        focused={store.isFocused()}
        store={store}
        onFocus={this._focus}
      >
        {input}
        {dropdown}
      </Container>
    );
  }
}
