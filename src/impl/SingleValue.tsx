import * as React from 'react';

import AssistedSearchStore from '../stores/AssistedSearchStore';
import AssistedSearch, {AssistedSearchProps} from '../AssistedSearch';
import {toValue} from '../util/convertValues';

import {GetValues} from '../types';
import {omit} from 'lodash';

export interface SingleValueProps extends AssistedSearchProps {
  /**
   * A callback to return the values for autocomplete.
   */
  getValues?: GetValues;
}

/**
 * A convenience component to use <AssistedSearch> in a more streamlined way, locking the value to the prop values as you
 * would an <input> component.
 *
 * @extends React.Component<SingleValueProps>
 */
export default class SingleValue extends React.Component<SingleValueProps> {
  private readonly _store: AssistedSearchStore;

  constructor(props: SingleValueProps) {
    super(props);
    let opts = Object.assign({getValues: props.getValues}, this.props.options);
    this._store = this.props.store || new AssistedSearchStore(opts, {value: toValue(props.value).value});
  }

  componentWillReceiveProps(nextProps: SingleValueProps) {
    let opts = this._store.options;
    Object.assign(opts, {
      getValues: nextProps.getValues,
      ...nextProps.options
    });
  }

  render() {
    return <AssistedSearch store={this._store} {...omit(this.props, 'getValues') as any} />;
  }
}
