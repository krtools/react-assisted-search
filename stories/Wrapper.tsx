import * as React from 'react';
import {ErrorInfo} from 'react';

export interface WrapperState {
  error?: Error,
  info?: ErrorInfo
}

export default class Wrapper extends React.Component<any, WrapperState> {
  state: WrapperState = {};

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({error, info});
  }

  render() {
    if (this.state.error) {
      return (
        <div className="alert alert-danger">
          <h4>Error in Component:</h4>
          <span style={{whiteSpace: 'pre-wrap', fontFamily: 'monospace'}}>
            {this.state.error.toString()}
          </span>
          <br/>
          <br/>
          <span style={{whiteSpace: 'pre-wrap', fontFamily: 'monospace'}}>
            {this.state.info!.componentStack}
          </span>
        </div>
      );
    }
    return (
      <React.Fragment>
        {this.props.children}
      </React.Fragment>
    );
  }
}
