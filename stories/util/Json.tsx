import * as React from 'react';

export default class Json extends React.Component<any> {
  render() {
    let json = this.props.json;
    let text = typeof json === 'string' ? json : JSON.stringify(json, null, '  ');
    
    return <span style={{fontFamily: 'monospace', whiteSpace: 'pre-wrap'}}>{text}</span>;
  }
}
