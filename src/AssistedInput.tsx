import * as React from 'react';
import AssistedSearchStore from './stores/AssistedSearchStore';
import {SyntheticEvent} from 'react';
import {Input} from './stores/ComponentStores';
import {omit} from './util/convertValues';

export interface AssistedInputProps {
  input: Input;
  store: AssistedSearchStore;

  [key: string]: any;
}

/**
 * Represents the main input for searching, and it's container, along with the entries that precede it.
 */
export default class AssistedInput extends React.Component<AssistedInputProps> {
  private el?: HTMLInputElement;

  private handleChange = (e: SyntheticEvent<HTMLInputElement>) => {
    let store = this.props.store;
    // for now, treating single different since it always changes the single-entry value (w/ the label)
    if (store.isSingle()) {
      store.setSingleValue(e.currentTarget.value);
    } else {
      store.setInput(e.currentTarget.value);
    }
  };

  componentDidMount() {
    this._checkFocus();
  }

  componentDidUpdate() {
    this._checkFocus();
  }

  private _checkFocus() {
    let store = this.props.store;
    if (store.activeElement === this.props.input && !store._pendingBlur) {
      if (document.activeElement !== this.el && this.el) {
        this.el.focus();
      }
    }
  }

  private onFocus = (e: FocusEvent) => {
    this.props.store.focus();
    if (this.props.onFocus) {
      this.props.onFocus(e);
    }
  };

  private _setEl = (el: HTMLInputElement) => {
    this.el = el;
    if (el) {
      el.addEventListener('focus', this.onFocus);
    }
  };

  render() {
    let {children, store, input, ...props} = this.props;

    if (store.isSingle()) {
      children = null;
    }

    let inputProps = omit(props, ['store', 'entries']);

    return (
      <div className="assisted-search-input-container">
        {children}
        <input
          size={1}
          onChange={this.handleChange}
          {...inputProps}
          value={input.value}
          ref={this._setEl}
          className="assisted-search-input"
          onFocus={this.onFocus}
        />
      </div>
    );
  }
}
