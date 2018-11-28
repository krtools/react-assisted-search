import * as React from 'react';
import classnames from 'classnames';
import AssistedSearchStore from './stores/AssistedSearchStore';
import {omit} from './util/convertValues';

export interface ContainerProps {
  children?: any;
  className?: string;
  focused?: boolean;
  store: AssistedSearchStore;

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
    // blur happens before focus, but is also annoying to manage w/ IE & react 15
    setTimeout(() => {
      if (this.el && !this.el.contains(document.activeElement)) {
        this.props.store.blur();
      }
    });
  };

  render() {
    let {children, className, focused, ...props} = omit(this.props, ['store']);

    return (
      <div
        className={classnames('assisted-search', {focused}, className)}
        tabIndex={-1}
        onBlur={this.onBlur}
        ref={this._setRef}
        {...props}
      >
        {children}
      </div>
    );
  }
}
