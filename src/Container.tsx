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
    // tentatively set to state to blurred, but do not commit state yet
    // this is to prevent a focus enforcement loop
    this.props.store.activeElement = null;
    // blur happens before focus, but is also annoying to manage w/ IE & react 15
    setTimeout(() => {
      let del = this.props.getDropdownEl();
      if (this.el && !this.el.contains(document.activeElement) && (!del || !del.contains(document.activeElement))) {
        this.props.store.blur();
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
