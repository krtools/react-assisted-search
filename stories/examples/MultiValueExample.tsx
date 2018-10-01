import * as React from 'react';
import MultiValue from '../../src/impl/MultiValue';
import Json from '../util/Json';
import {lookupStates} from '../lookups';
import {Value} from '../../src/types';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';

/**
 * Basic Example of using <MultiValue> with minimal configuration.
 */
export default class MultiValueExample extends React.Component<any> {
  state: any = {
    value: ''
  };

  changeValue = (value: any, entries, store: AssistedSearchStore) => {
    this.setState({
      value: value,
      input: store.input,
      entries: store.entries,
      storeValue: store.getValueForType()
    });
  };

  async getStates(query: string): Promise<Value[]> {
    let results = await lookupStates(query);
    return results.map(r => ({
      value: r.value
    }));
  }

  render() {
    let state = this.state;

    return (
      <div className="row">
        <div className="col-sm-6">
          <h4>Input</h4>
          <MultiValue
            onChange={this.changeValue}
            getValues={this.getStates}
            options={{autoSelectFirst: true, minLength: 0}}
          />
        </div>
        <div className="col-sm-6">
          <h4>Value</h4>
          <Json
            json={{
              input: state.input,
              entries: state.entries,
              storeValue: state.storeValue
            }}
          />
        </div>
      </div>
    );
  }
}
