import * as React from 'react';
import classnames from 'classnames';

export interface DropdownProps {
  custom?: boolean;

  [key: string]: any;
}

export default class Dropdown extends React.Component<DropdownProps> {
  render() {
    let {custom, className, ...props} = this.props;

    return (
      <div className={classnames({'assisted-search-dropdown': !custom}, className)} {...props}>
        {this.props.children}
      </div>
    );
  }
}
