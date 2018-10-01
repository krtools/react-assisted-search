import * as React from 'react';
import Json from '../util/Json';

export interface WithInfoProps {
  setState: Function;
  state: any;
}

export class WithInfo extends React.Component<WithInfoProps> {
  render() {
    let state: any = this.props;

    return (
      <div className="row">
        <div className="col-sm-6">
          <h4>Component</h4>
          {this.props.children}
        </div>
        <div className="col-sm-6">
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
            <a onClick={() => this.props.setState({value: 'newValue'})}>Change to 'NewValue'</a>
          </div>
        </div>
      </div>
    );
  }
}
