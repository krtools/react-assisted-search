import * as React from 'react';

import USMapSvg from './USMapSvg';
import {omit} from 'lodash';
import AssistedSearchStore from '../../../src/stores/AssistedSearchStore';

export interface WithStore {
  store: AssistedSearchStore;

  [key: string]: any;
}

export default class USMapDropdown extends React.Component<WithStore> {
  onSelect = (state: any) => {
    /** @type {AssistedSearchStore} */
    let store = this.props.store;
    store.dropdown.items = [{value: state.name}];
    store.selectExact([0], store.isSingle());
  };

  render() {
    /** @type {AssistedSearchStore} */
    let store = this.props.store;

    let {multiple, single} = this.props;

    let selected;
    if (multiple && store.getSingleValue()) {
      selected = store.getSingleValue().value;
    } else if (single && store.getValues()) {
      selected = store.getValues().map(e => e.value);
    }

    return (
      <div {...omit(this.props, ['store', 'children'])}>
        {this.props.children}
        <USMapSvg onSelect={this.onSelect} selected={selected}/>
      </div>
    );
  }
}
