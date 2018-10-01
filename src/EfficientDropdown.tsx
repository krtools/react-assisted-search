import * as React from 'react';

import {DropdownOption} from './types';
import AssistedSearchStore from './stores/AssistedSearchStore';
import MenuItem from './MenuItem';
import Dropdown from './Dropdown';

export interface EfficientDropdownProps {
  items: DropdownOption[];
  selectedItems: DropdownOption[];
  store: AssistedSearchStore;
}

// only renders this code when the items array changes.
export class EfficientDropdown extends React.Component<EfficientDropdownProps> {
  shouldComponentUpdate(nextProps: EfficientDropdownProps) {
    let props = this.props;
    return nextProps.items !== props.items || props.selectedItems !== nextProps.selectedItems;
  }

  onSelectItem = (item: DropdownOption) => {
    let store = this.props.store;
    // TODO: ugh fix inconsistency between number and option usage
    store.setSelectedItem(store.dropdown.items.indexOf(item), true, store.isSingle());
  };

  render() {
    let store = this.props.store;

    let customDropdown;
    if (store.dropdown.content) {
      customDropdown = store.dropdown.content;
    }

    let items;
    if (customDropdown) {
      return customDropdown;
    } else if (store.dropdown.items) {
      if (!store.dropdown.items.length) {
        // TODO empty indicator
        // TODO loading indicator
        return null;
      } else {
        let template = store.getOptionTemplate();
        items = store.dropdown.items.map((item, i) => {
          let menuItem;
          if (template) {
            menuItem = template(store.input.facet, item, store);
          }
          return (
            <MenuItem selected={store.isSelectedItem(item)} key={item.value} item={item} onSelect={this.onSelectItem}>
              {menuItem}
            </MenuItem>
          );
        });
      }
    } else {
      return null;
    }

    return <Dropdown custom={!!customDropdown}>{items}</Dropdown>;
  }
}
