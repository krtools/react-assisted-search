import * as React from 'react';

import {GetFacets, GetValues} from '../types';
import AssistedSearchStore from '../stores/AssistedSearchStore';
import AssistedSearch, {AssistedSearchProps} from '../AssistedSearch';

import {omit} from 'lodash';

export interface FacetedValueProps extends AssistedSearchProps {
  /** A callback to return the values for autocomplete */
  getValues?: GetValues;
  /**
   * A callback to return the facet (filter) suggestions for autocomplete, can also be used to return
   * standalone non-facet values
   */
  getFacets?: GetFacets;
}

// would be nice if there was a transformer/loader that could pull these from the interface itself
const OMITTED_PROPS = ['getValues', 'getFacets', 'store', 'options'];

/**
 * A convenience component for the faceted-type variant of <AssistedSearch>, with entries/onChange/getValues/getFacets
 * available as direct props.
 *
 * @extends React.Component<FacetedValueProps>
 */
export default class FacetedValue extends React.Component<FacetedValueProps> {
  _store: AssistedSearchStore;
  
  constructor(props: FacetedValueProps) {
    super(props);
    this._store =
      this.props.store ||
      new AssistedSearchStore(
        {
          type: 'faceted',
          getValues: props.getValues,
          getFacets: props.getFacets,
          ...props.options
        },
        {
          entries: props.entries
        }
      );
  }
  
  render() {
    return <AssistedSearch store={this._store} {...omit(this.props, OMITTED_PROPS)} />;
  }
}
