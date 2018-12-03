import * as React from 'react';
import classnames from 'classnames';

import './us-map.scss';
// @ts-ignore
import data from './usmapdata.json';
import {Nullable} from '../../../src/types';

interface USMapSvgProps {
  selected?: Nullable<string | string[]>;
  onSelect: Function;
}

interface USState {
  name: string;
  d: string;
}

export default class USMapSvg extends React.Component<USMapSvgProps> {
  render() {
    let selected = this.props.selected;

    let states = data.map((s: USState) => (
      <StatePolygon
        selected={selected ? selected.includes(s.name) : false}
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

interface StatePolygonProps {
  selected: boolean;
  state: USState;
  onClick: Function;
}

class StatePolygon extends React.Component<StatePolygonProps> {
  onClick = (e: React.MouseEvent) => this.props.onClick(this.props.state, e);

  render() {
    let state = this.props.state;

    let clsName = classnames('state', {
      selected: this.props.selected
    });

    return <path onClick={this.onClick} className={clsName} d={state.d} />;
  }
}
