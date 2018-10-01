import {Facet} from './types';
import * as React from 'react';

export interface PendingProps {
  facet: Facet;
  // not yet implemented
  operator?: string;
}

/**
 * Represents a facet candidate that has yet to have a value committed to it.
 */
export class Pending extends React.Component<PendingProps> {
  render() {
    let facet = this.props.facet;

    return (
      <div className="assisted-search-pending-facet">
        {facet.label || facet.value}
        {this.props.operator || ':'}
      </div>
    );
  }
}
