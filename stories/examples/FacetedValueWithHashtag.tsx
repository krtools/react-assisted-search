import * as React from 'react';
import FacetedValue from '../../src/impl/FacetedValue';
import {getFacets, getValues} from '../lookups';
import {DropdownOption, Facet} from '../../src/types';

export default class FacetedValueWithHashtag extends React.Component<any, any> {
  render() {
    return (
      <div>
        <FacetedValue
          getValues={getValues}
          getFacets={combinedFacetLookup}
          options={{
            minLength: 0,
            isStandaloneValue: isHashTag
          }}
        />
      </div>
    );
  }
}

function isHashTag(input: string) {
  return /^#/.test(input);
}

function combinedFacetLookup(value: string): DropdownOption[] | Promise<Facet[]> {
  return isHashTag(value) ? lookupHashTags(value) : getFacets(value);
}

const hashtags = `hello
world
data
moretags
anothertag`.split('\n');

function lookupHashTags(query: string): DropdownOption[] {
  let queryLc = query.toLowerCase().slice(1);
  return hashtags.filter(e => e.toLowerCase().startsWith(queryLc)).map(e => ({
    value: `#${e}`,
    isFacet: true
  }))
}
