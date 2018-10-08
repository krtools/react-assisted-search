import * as React from 'react';

import {DropdownOption} from './types';
import AssistedSearchStore from './stores/AssistedSearchStore';
import MenuItem from './MenuItem';
import Dropdown from './Dropdown';
import {FullWidthDropdown} from './dropdowns/FullWidthDropdown';

export interface DropdownItemsProps {
  store: AssistedSearchStore;
}

export class DropdownWrapper extends React.Component<DropdownItemsProps> {
  render() {
    let store = this.props.store;
    if (store.dropdown.content) {
      return store.dropdown.content();
    } else if (store.dropdown.items) {
      if (!store.dropdown.items.length) {
        // TODO empty indicator
        // TODO loading indicator
        return null;
      } else {
        return (
          <FullWidthDropdown>
            <DropdownItems store={store}/>
          </FullWidthDropdown>
        );
      }
    } else {
      return null;
    }
  }
}

// only renders this code when the items array changes.
export class DropdownItems extends React.Component<DropdownItemsProps> {
  onSelectItem = (item: DropdownOption) => {
    let store = this.props.store;
    // TODO: ugh fix inconsistency between number and option usage
    store.setSelectedItem(store.dropdown.items.indexOf(item), true, store.isSingle());
  };

  render() {
    let store = this.props.store;
    let template = store.getOptionTemplate();
    let items = store.dropdown.items.map(item => {
      return (
        <MenuItem selected={store.isSelectedItem(item)} key={item.value} item={item} onSelect={this.onSelectItem}>
          {template ? template(item, store.input.facet, store) : null}
        </MenuItem>
      );
    });

    return items.length ? <Dropdown>{items}</Dropdown> : null;
  }
}
