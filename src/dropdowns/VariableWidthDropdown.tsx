import * as React from 'react';
import {CSSProperties} from 'react';

export interface VariableWidthDropdownProps {
  style: object;
  [key: string]: any;
}

/**
 * A dynamic width dropdown for content with a max and min width. Requires support for
 * flexbox and pointer-events.
 */
export class VariableWidthDropdown extends React.Component<VariableWidthDropdownProps> {
  render() {
    let {children, style, ...props} = this.props;
    
    let outerDivStyle = {
      pointerEvents: 'none',
      display: 'flex',
      width: '100%',
      position: 'absolute',
      top: '100%'
    } as any;
    
    let innerDivStyle = {
      pointerEvents: 'auto',
      flexBasis: 'auto',
      ...style
    } as CSSProperties;
    
    return (
      <div style={outerDivStyle}>
        <div className="assisted-search-base-dropdown" style={innerDivStyle} {...props}>
          {children}
        </div>
      </div>
    );
  }
}
