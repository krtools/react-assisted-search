import * as React from 'react';
import AutosizeInput from 'react-input-autosize';

import classnames from 'classnames';
import AssistedSearchStore from './stores/AssistedSearchStore';
import setSelection from './util/setSelection';
import {Entry} from './stores/ComponentStores';
import {SyntheticEvent} from 'react';

export interface VisualEntryProps {
  entry: Entry;
  store: AssistedSearchStore;
  onRemove: (e: Entry) => any;

  [key: string]: any;
}

/**
 * Represents an entered filter in the visual search bar
 */
export default class VisualEntry extends React.Component<VisualEntryProps> {
  private _focusEntry = () => {
    let store = this.props.store;
    let entry = this.props.entry;
    if (!store.isActiveEntry(entry)) {
      store.focus(entry);
    }
  };

  componentWillReceiveProps(props: VisualEntryProps) {
    this._checkFocus(props);
  }

  componentDidMount() {
    this._checkFocus(this.props);
  }

  _input: any;

  _setRef = (ref: any) => (this._input = ref);

  /**
   * Handler to remove entry from the store
   * @returns {*}
   * @private
   */
  _remove = () => this.props.onRemove && this.props.onRemove(this.props.entry);

  /**
   * Change the value in the store
   * @param e
   * @private
   */
  _change = (e: SyntheticEvent<HTMLInputElement>) => {
    /** @type {AssistedSearchStore} */
    let store = this.props.store;
    if (e.currentTarget.value === '' || !this._isFixed()) {
      store.setEntryValue(this.props.entry, e.currentTarget.value);
    }
  };

  /**
   * Set the current active entry
   * @private
   */
  _focus = () => {
    let store = this.props.store;
    // important to not trigger focus if already because it clears entry selections
    // focus lets you "re-focus" for convenience, although maybe it shouldn't
    if (!store.isActiveEntry(this.props.entry)) {
      store.focus(this.props.entry);
    }
  };

  componentDidUpdate() {
    let input = this._input.getInput();
    if (input && this._isFixed() && document.activeElement === input) {
      input.select();
    }
  }

  _isFixed() {
    let store = this.props.store;
    return !store.customValues(store.input.facet);
  }

  /**
   * Syncs focus of input and state with DOM input
   * @private
   */
  _checkFocus(props: VisualEntryProps) {
    let el = this._input.getInput();

    if (props.store.isActiveEntry(props.entry) && document.activeElement !== el) {
      el.focus();
      let selectionStart = props.entry.input.selectionStart;
      if (typeof selectionStart === 'number') {
        setSelection(el, selectionStart, props.entry.input.selectionEnd);
        props.store.clearSelection(props.entry.input);
      }
    }
  }

  render() {
    let entry = this.props.entry;
    let searchEntry = entry.entry;
    let store = this.props.store;

    let entryFacet = searchEntry.facet ? (
      <span className="assisted-search-entry-facet" onClick={this._focusEntry}>
        {this.props.useLabel ? searchEntry.facet.label : searchEntry.facet.value}
      </span>
    ) : null;

    let entryOperator;
    if (entryFacet) {
      entryOperator = <span className="assisted-search-entry-operator">{searchEntry.operator || ':'}</span>;
    }

    let close = store.isSingle() ? null : (
      <span className="assisted-search-entry-close" onClick={this._remove}>
        <span>{this.props.closeText || '×'}</span>
      </span>
    );

    let {selected, focused} = this.props;

    return (
      <span className={classnames('assisted-search-entry', {selected, focused})}>
        {!this.props.closeRight ? close : null}
        {entryFacet}
        {entryOperator}
        {/*<span className="assisted-search-entry-value">{entry.values[0].value}</span>*/}
        <AutosizeInput
          onFocus={this._focus}
          ref={this._setRef}
          inputClassName="assisted-search-entry-value"
          value={entry.input.value}
          onChange={this._change}
        />
        {this.props.closeRight ? close : null}
      </span>
    );
  }
}
