import * as React from 'react';
import SingleValue from '../../src/impl/SingleValue';
import AssistedSearchStore from '../../src/stores/AssistedSearchStore';
import {DropdownOption, Facet} from '../../src/types';
import KeyboardEventDispatcher from '../../src/stores/KeyboardEventDispatcher';

export default class FilenameLookup extends React.Component {
  state = {
    submitted: ''
  };

  private onChange = (value: string) => {
    this.setState({
      submitted: value
    });
  };

  private onKeyDown = (e: any, store: AssistedSearchStore, ed: KeyboardEventDispatcher) => {
    if (store.showingDropdown() && store.hasSelectedItems() && /^[\/\\]$/.test(e.key)) {
      store.runInAction(() => {
        ed.tab(e);
        store.setInput(store.input.value + e.key);
      });
    }
  };

  render() {
    let submission = (
      <React.Fragment>
        <hr/>
        <div>
          <h4>Current Value: '{this.state.submitted}'</h4>
        </div>
      </React.Fragment>
    );

    return (
      <div>
        <SingleValue
          getValues={listFiles}
          onChange={this.onChange}
          options={{
            onKeyDown: this.onKeyDown,
            optionTemplate: (v: DropdownOption, facet: Facet | null, store: AssistedSearchStore) => {
              let value = store.input.value;
              let bold = v.value.slice(0, value.length);
              let non = v.value.slice(value.length);

              return (
                <div>
                  <strong>{bold}</strong>
                  {non}
                </div>
              );
            }
          }}
        />
        {submission}
      </div>
    );
  }
}

async function listFiles(query: string): Promise<string[]> {
  let qlc = query.toLowerCase().replace(/\\/g, '/');
  return FILES.filter(file => {
    let fileLc = file.toLowerCase();
    // name stars with query AND is in the same hierarchy
    if (qlc.endsWith('*')) {
      return fileLc.startsWith(qlc.slice(0, -1));
    }
    return fileLc.startsWith(qlc) && fileLc.indexOf('/', qlc.length + (qlc.length === 1 ? 2 : 1)) === -1;
  });
}

let FILES = `C:/
C:/spot
C:/spot/sleep
C:/spot/poo
C:/spot/run
C:/spot/run/fast
C:/spot/run/fast/tomorrow
C:/spot/run/fast/yesterday
C:/spot/run/fast/today
C:/spot/run2
D:/run
D:/run/spot
D:/run/slow
D:/run/fast
D:/run/spot/run
D:/run/spot/run2
`.split('\n');
