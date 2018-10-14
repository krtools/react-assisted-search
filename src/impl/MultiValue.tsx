import * as React from 'react';

import AssistedSearchStore from '../stores/AssistedSearchStore';
import AssistedSearch, {AssistedSearchProps} from '../AssistedSearch';
import {GetValues, AssistedSearchOptions} from '../types';
import {omit} from '../util/convertValues';

export interface MultiValueProps extends AssistedSearchProps {
  /** A callback to return the values for autocomplete */
  getValues?: GetValues;
}

/**
 * A convenience component for the faceted-type variant of <AssistedSearch>, with value/onChange/getValues available as
 * direct props.
 *
 * @extends React.Component<MultiValueProps>
 */
export default class MultiValue extends React.Component<MultiValueProps> {
  _store: AssistedSearchStore;

  constructor(props: MultiValueProps) {
    super(props);

    let opts: AssistedSearchOptions = {
      getValues: props.getValues,
      type: 'multiple',
      ...this.props.options
    };

    this._store = this.props.store || new AssistedSearchStore(opts);
  }

  render() {
    return <AssistedSearch store={this._store} {...omit(this.props, OMITTED_PROPS) as any} />;
  }
}

const OMITTED_PROPS = ['getValues', 'options', 'value'];
