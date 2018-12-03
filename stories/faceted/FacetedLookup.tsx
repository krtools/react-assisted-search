import * as React from 'react';

import AssistedSearch from '../../src/AssistedSearch';

import '../../src/styles/assisted-search.scss';
import '../../src/styles/assisted-search-bootstrap3.scss';

import {getValues, getFacets, getDropdown} from '../lookups';
import {AllowCustomValue, RewriteValue, AssistedSearchOptions, Value} from '../../src/types';

export interface FacetedLookupProps {
  customValues: AllowCustomValue;
  customDropdown: null;
  rewriteValue?: RewriteValue;
  standalone?: boolean;
}

/**
 * A simple example showing 2 facets available for lookups
 */
export default class FacetedLookup extends React.Component<FacetedLookupProps> {
  render() {
    let {customValues, customDropdown, rewriteValue, standalone} = this.props;

    let options: AssistedSearchOptions = {
      // can also just be "single"
      autoSelectFirst: true,
      type: 'faceted',
      minLength: 0,
      customValues: customValues,
      rewriteValue: rewriteValue ? rewriteInput : null,
      getDropdown: customDropdown ? getDropdown : null,
      getValues: getValues,
      getFacets: getFacets,
      isStandaloneValue: standalone ? isFilter : null,
      placeholder: 'Placeholder'
    };

    return <AssistedSearch options={options} />;
  }
}

const isFilter = (val: string) => /^filter:|^#\S+/.test(val);
const rewriteInput = (value: Value) => value.value + '-rewrite';
