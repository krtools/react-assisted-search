import * as React from 'react';
import classnames from 'classnames';

export interface FullWidthDropdownProps {
  className?: string;
  children?: any;
  style?: object;

  [key: string]: any;
}

/**
 * Convenience component to take up 100% of the input container's width.
 */
export class FullWidthDropdown extends React.Component<FullWidthDropdownProps> {
  render() {
    let {className, children, style, ...props} = this.props;

    return (
      <div
        className={classnames('assisted-search-dropdown-parent assisted-search-base-dropdown', className)}
        style={{width: '100%', ...style}}
        {...props}
      >
        {children}
      </div>
    );
  }
}
