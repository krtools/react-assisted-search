import * as React from 'react';
import classnames from 'classnames';
import autoPosition from './util/autoPosition';

export interface DropdownProps {
  custom?: boolean;

  [key: string]: any;
}

export default class Dropdown extends React.Component<DropdownProps> {
  el: HTMLDivElement;

  _setRef = (el: HTMLDivElement) => {
    this.el = el;
  };

  positionElement() {
    if (this.el) {
      autoPosition(this.el, 'drop-up');
    }
  }

  componentDidMount() {
    this.positionElement();
  }

  componentDidUpdate() {
    this.positionElement();
  }

  render() {
    let {custom, className, ...props} = this.props;

    return (
      <div className={classnames({'assisted-search-dropdown': !custom}, className)} {...props} ref={this._setRef}>
        {this.props.children}
      </div>
    );
  }
}
