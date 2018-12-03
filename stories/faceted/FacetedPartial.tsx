import * as React from 'react';
import {ReactNode} from 'react';
import {getFacets, getValues} from '../lookups';
import {DropdownOption, Facet} from '../../src/types';
import {createPartial} from '../../src/util/convertValues';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import FacetedValue from '../../src/impl/FacetedValue';

export default class FacetedPartial extends React.Component {
  render() {
    return (
      <FacetedValue
        getValues={getValuesWithPartial}
        getFacets={getFacets}
        options={{
          optionTemplate: optionTemp
        }}
      />
    );
  }
}

function optionTemp(item: DropdownOption, facet: Facet | null, store: AssistedSearchStore): ReactNode | undefined {
  let match = HELLO.exec(store.activeElement!.value);
  if (!item.partial || !match) {
    return undefined;
  }

  return (
    <span>
      <strong>{store.activeElement!.value.slice(match.index)}</strong>
      {item.value.slice(match.index + match[0].length)}
    </span>
  );
}

const HELLO = /(he)\S*$/;

function getValuesWithPartial(value: string, facet: string | null): DropdownOption[] | Promise<DropdownOption[]> {
  if (HELLO.test(value)) {
    return [createPartial(value.replace(HELLO, '$1') + 'llo world', 'hello world')];
  }
  return getValues(value, facet);
}
