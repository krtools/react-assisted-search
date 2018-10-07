import * as React from 'react';

import AssistedSearch from '../../src/AssistedSearch';
import {AssistedSearchType} from '../../src/stores/AssistedSearchType';

import '../../src/styles/assisted-search.scss';
import '../../src/styles/assisted-search-bootstrap3.scss';

import {lookupStates, lookupWithStateCodes, getDropdown, STATE} from '../lookups';
import {AllowCustomValue, RewriteValue, AssistedSearchOptions, GetDropdown} from '../../src/types';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';

export interface StateLookupProps {
  type?: AssistedSearchType;
  customValues?: boolean | AllowCustomValue;
  rewriteValue?: RewriteValue;
  noDupes?: boolean;
  labels?: boolean;
  customMenuItem?: boolean;
  customDropdown?: boolean;
}

export default class StateLookup extends React.Component<StateLookupProps> {
  render() {
    let {type, customValues, rewriteValue, noDupes, labels, customMenuItem, customDropdown} = this.props;

    let getOptionTemplate;
    if (customMenuItem) {
      getOptionTemplate = (facet, value) => {
        let metadata = value.metadata || {};
        return (
          <div>
            <strong style={{color: '#707070'}}>
              {value.value} ({metadata.abbr})
            </strong>
            <div style={{lineHeight: '10px', color: '#aaa', fontSize: '13px'}}>
              <small>Capital: {metadata.capital || '(None)'}</small>
            </div>
          </div>
        );
      };
    }

    let getCustomDropdown: GetDropdown;
    if (customDropdown) {
      getCustomDropdown = (items, input, facet, store) => getDropdown(items, input, {value:'state'}, store);
    }

    let options: AssistedSearchOptions = {
      // can also just be "single"
      type: type || 'single',
      customValues: customValues === undefined ? true : customValues,
      optionTemplate: getOptionTemplate,
      getDropdown: getCustomDropdown,
      rewriteValue: rewriteValue ? value => value + '-rewrite' : null,
      minLength: 0,
      getValues: noDupes ? getValuesNoDupes : labels ? lookupWithStateCodes : lookupStates,
      placeholder: 'States'
    };

    return <AssistedSearch options={options}/>;
  }
}

async function getValuesNoDupes(q: string, facet: string, store: AssistedSearchStore) {
  let states = await lookupStates(q);
  let values = store.getValues().map(e => e.value);
  return states.filter(val => !values.includes(val.value));
}
