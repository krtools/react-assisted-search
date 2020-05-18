import * as React from 'react';
import classnames from 'classnames';
import AssistedSearchStore from './stores/AssistedSearchStore';
import {omit} from './util/convertValues';
import {MouseEvent} from 'react';
import {Nullable} from './types';

export interface ContainerProps {
  children?: any;
  className?: string;
  focused?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => any;
  store: AssistedSearchStore;
  getDropdownEl: () => Nullable<HTMLElement>;

  [key: string]: any;
}

/**
 * The main container and entry point.
 */
export default class Container extends React.Component<ContainerProps> {
  private el?: HTMLDivElement;

  private _setRef = (el: HTMLDivElement) => {
    this.el = el;
  };

  onBlur = () => {
    const store = this.props.store;
    store._pendingBlur = true;
    setTimeout(() => {
      const dropdown = this.props.getDropdownEl();
      const activeElement = document.activeElement;
      const el = this.el;
      if (store._pendingBlur && el && !el.contains(activeElement) && (!dropdown || !dropdown.contains(activeElement))) {
        store.blur();
      }
    });
  };

  private _click = (e: MouseEvent<HTMLDivElement>) => {
    if (this.props.store.isFocused() && !this.props.store.showingDropdown()) {
      this.props.store.updateDropdown();
    }
    if (this.props.onClick) {
      this.props.onClick(e);
    }
  };

  render() {
    let {children, className, focused, ...props} = omit(this.props, ['store', 'getDropdownEl']);

    return (
      <div
        className={classnames('assisted-search', {focused}, className)}
        tabIndex={-1}
        onBlur={this.onBlur}
        ref={this._setRef}
        {...props}
        onClick={this._click}
      >
        {children}
      </div>
    );
  }
}
