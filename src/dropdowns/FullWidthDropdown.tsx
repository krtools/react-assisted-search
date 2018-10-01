import * as React from 'react';
import classnames from 'classnames';

export interface FullWidthDropdownProps {
  className?: string,
  children?: any,
  style?: object,
  [key: string] : any
}

/**
 * Convenience component to take up 100% of the input container.
 */
export class FullWidthDropdown extends React.Component<FullWidthDropdownProps> {
  render() {
    let {className, children, style, ...props} = this.props;

    let cls = classnames('assisted-search-base-dropdown', className);

    return (
      <div className={cls} style={{width: '100%', ...style}} {...props}>
        {children}
      </div>
    );
  }
}
