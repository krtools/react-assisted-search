import React from 'react';
import classnames from 'classnames';

import './us-map.scss';
import data from './usmapdata.json';

export default class USMapSvg extends React.Component {
  render() {
    let selected = this.props.selected;

    let states = data.map(s => (
      <StatePolygon
        selected={selected ? selected.includes(s.name) : null}
        state={s}
        key={s.name}
        onClick={this.props.onSelect}
      />
    ));

    return (
      <svg width="100%" viewBox="25 25 1100 750">
        <g>{states}</g>
      </svg>
    );
  }
}

class StatePolygon extends React.Component {
  onClick = e => this.props.onClick(this.props.state, e);

  render() {
    let state = this.props.state;

    let clsName = classnames('state', {
      selected: this.props.selected
    });

    return <path onClick={this.onClick} className={clsName} d={state.d} />;
  }
}
