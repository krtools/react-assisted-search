import * as React from 'react';
import classnames from 'classnames';
import {omit} from 'lodash';
import AssistedSearchStore from './stores/AssistedSearchStore';
import {SyntheticEvent} from 'react';
import {Input} from './stores/ComponentStores';

export interface AssistedInputProps {
  input: Input;
  store: AssistedSearchStore;

  [key: string]: any;
}

/**
 * Represents the main input for searching, and it's container, along with the entries that precede it.
 */
export default class AssistedInput extends React.Component<AssistedInputProps> {
  private el: HTMLInputElement;

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
    if (store.activeElement === this.props.input) {
      if (document.activeElement !== this.el) {
        this.el.focus();
      }
    }
  }

  private onFocus = (e: SyntheticEvent<HTMLInputElement>) => {
    this.props.store.focus();
    if (this.props.onFocus) {
      this.props.onFocus(e);
    }
  };

  private _setEl = (el: HTMLInputElement) => {
    this.el = el;
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
