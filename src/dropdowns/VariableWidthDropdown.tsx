import * as React from 'react';
import classnames from 'classnames';
import {CSSProperties} from 'react';

export interface VariableWidthDropdownProps {
  style?: object;

  [key: string]: any;
}

/**
 * A dynamic width dropdown for content with a max and min width. Requires support for
 * flexbox and pointer-events.
 */
export class VariableWidthDropdown extends React.Component<VariableWidthDropdownProps> {
  render() {
    let {children, className, style, ...props} = this.props;

    let outerDivStyle = {
      pointerEvents: 'none',
      display: 'flex',
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0
    } as any;

    let innerDivStyle = {
      pointerEvents: 'auto',
      flexBasis: 'auto',
      ...style
    } as CSSProperties;

    return (
      <div style={outerDivStyle}>
        <div
          {...props}
          className={classnames('assisted-search-dropdown-parent assisted-search-base-dropdown', className)}
          style={innerDivStyle}
        >
          {children}
        </div>
      </div>
    );
  }
}
