import * as React from 'react';
import classnames from 'classnames';
import autoPosition from './util/autoPosition';

export interface DropdownProps {
  custom?: boolean;
  
  [key: string] : any;
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

    let cls = classnames('assisted-search-base-dropdown', {'assisted-search-dropdown': !custom}, className);

    return (
      <div className={cls} {...props} ref={this._setRef}>
        {this.props.children}
      </div>
    );
  }
}
