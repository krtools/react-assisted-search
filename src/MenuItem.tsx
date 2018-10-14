import * as React from 'react';
import classnames from 'classnames';

import {scrollIfNeeded} from './util/scrollIfNeeded';
import {DropdownOption} from './types';
import {SyntheticEvent} from 'react';
import {omit} from './util/convertValues';

export interface MenuItemProps {
  onSelect: (item: DropdownOption) => any,
  item: DropdownOption;
  selected?: boolean;
}

/**
 * Represents the default MenuItem in the dropdown list.
 */
export default class MenuItem extends React.Component<MenuItemProps> {
  el: HTMLDivElement;

  setRef = (el: HTMLDivElement) => (this.el = el);

  componentWillReceiveProps(props: MenuItemProps) {
    this.scrollIfNeeded(props);
  }

  componentDidMount() {
    this.scrollIfNeeded(this.props);
  }

  scrollIfNeeded(props: MenuItemProps) {
    if (props.selected) {
      scrollIfNeeded(this.el);
    }
  }

  private _onClick = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (this.props.onSelect) {
      this.props.onSelect(this.props.item);
    }
  };

  render() {
    let {item, children, selected, ...props} = this.props;

    let content;
    if (children) {
      content = children;
    } else {
      content = (
        <div>
          <span className="assisted-search-dropdown-item-name">{item.label || item.value}</span>
          <span className="assisted-search-dropdown-item-description">{item.description}</span>
        </div>
      );
    }

    return (
      <div
        className={classnames('assisted-search-dropdown-item', {selected})}
        {...omit(props, 'onSelect') as any}
        onClick={this._onClick}
        ref={this.setRef}
      >
        {content}
      </div>
    );
  }
}
