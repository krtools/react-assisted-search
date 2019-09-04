import * as React from 'react';
import FacetedValue from '../../src/impl/FacetedValue';
import {getFacets, getValues} from '../lookups';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {Nullable, SearchEntry} from '../../src/types';
import {Input} from '../../src/stores/ComponentStores';

export interface FacetedValueExampleState {
  entries?: SearchEntry[];
  events?: any[];
  value?: any;
  input?: Input;
}

export default class FacetedValueExample extends React.Component<any, FacetedValueExampleState> {
  state: FacetedValueExampleState = {
    entries: [],
    events: []
  };

  change = (e: any, entries: SearchEntry[], store: AssistedSearchStore) => {
    this.setState({
      entries: store.entries.map(e => e.entry),
      input: store.input
    });
  };

  render() {
    let state = this.state;

    return (
      <div className="row">
        <div className="col-sm-6">
          <h4>Component</h4>
          <FacetedValue
            getValues={getValues}
            getFacets={getFacets}
            onChange={this.change}
            entries={this.state.entries}
            options={{
              minLength: 0,
              placeholder: (facet: Nullable<string>) => {
                return facet ? `Value for ${facet}` : 'Enter Facet';
              }
            }}
          />
        </div>
        <div className="col-sm-6">
          <h4>Output</h4>
          <hr />
          <div className="well well-sm">
            <h4>Input: {state.input ? state.input.value : ''}</h4>
          </div>
          <EntryTable entries={state.entries || []} />
          <p />
        </div>
      </div>
    );
  }
}

export interface EntryTableProps {
  entries: SearchEntry[] | null;
}

class EntryTable extends React.Component<EntryTableProps> {
  render() {
    let rows;
    if (this.props.entries && this.props.entries.length) {
      rows = this.props.entries.map((e, i) => (
        <tr key={`${i}-${e.value && e.value.value}-${e.facet && e.facet.value}`}>
          <td>{e.facet && e.facet.value}</td>
          <td>{e.value && e.value.value}</td>
        </tr>
      ));
    } else {
      rows = (
        <tr>
          <td colSpan={2}>
            <i>No Values...</i>
          </td>
        </tr>
      );
    }

    return (
      <table className="table">
        <thead>
          <tr>
            <th>Facet</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
}
