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
    let dropdown = store.dropdown;

    // custom dropdown always takes precedence
    if (dropdown.content) {
      let content = dropdown.content();
      // false indicates to not render anything
      if (content === false) {
        return null;
      }
      // null/undefined means allow default behavior as if getDropdown is not present
      if (content != null) {
        return content;
      }
    }

    // should we show the loading indicator?
    let loadingDropdown = dropdown.loadingDropdown;
    if (loadingDropdown) {
      if (typeof loadingDropdown === 'string') {
        return <FullWidthDropdown>{loadingDropdown}</FullWidthDropdown>;
      }
      return loadingDropdown;
    }

    if (dropdown.error) {
      return dropdown.error;
    }

    if (dropdown.items && dropdown.items.length) {
      return (
        <FullWidthDropdown>
          <DropdownItems store={store}/>
        </FullWidthDropdown>
      );
    }
    return null;
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
          {template ? template(item, store.input.facet || null, store) : null}
        </MenuItem>
      );
    });

    return items.length ? <Dropdown>{items}</Dropdown> : null;
  }
}
