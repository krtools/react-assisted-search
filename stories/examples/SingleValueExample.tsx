import * as React from 'react';
import SingleValue from '../../src/impl/SingleValue';
import Json from '../util/Json';

import {lookupStates} from '../lookups';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {SearchEntry} from '../../src/types';

export interface SingleValueExampleState {
  input?: string;
  entries?: SearchEntry[];
  storeValue?: any;
  value?: any;

  [key: string]: any;
}

/**
 * Basic Example of using <SingleValue> with minimal configuration.
 */
export default class SingleValueExample extends React.Component<any, SingleValueExampleState> {
  state: SingleValueExampleState = {};

  changeValue = (value: string, entries: SearchEntry[], store: AssistedSearchStore) => {
    this.setState({
      value: value,
      input: store.input.value,
      entries: store.entries.map(e => e.entry),
      storeValue: store.getValueForType()
    });
  };

  async getStates(query: string) {
    let results = await lookupStates(query);
    return results.map(r => ({
      value: r.value
    }));
  }

  render() {
    let state: SingleValueExampleState = this.state;

    return (
      <div className="row">
        <div className="col-sm-6">
          <h4>Component</h4>
          <SingleValue value={state.value} onChange={this.changeValue} getValues={this.getStates}/>
        </div>
        <div className="col-sm-6">
          <h4>Value</h4>
          <Json json={state.value}/>
          <h4>Input</h4>
          <Json
            json={{
              input: state.input,
              entries: state.entries,
              storeValue: state.storeValue
            }}
          />
          <p/>
          <a onClick={() => this.setState({value: 'newValue'})}>Change to 'NewValue'</a>
        </div>
      </div>
    );
  }
}
