import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ClassAttributes, CSSProperties} from 'react';

export interface MountedDropdownProps extends ClassAttributes<MountedDropdown> {
  mount: HTMLElement;
}

export class MountedDropdown extends React.Component<MountedDropdownProps> {
  el?: HTMLDivElement;
  rel?: HTMLDivElement;

  _setRef = (e: HTMLDivElement) => {
    this.el = e;
  };

  _setRel = (e: HTMLDivElement) => {
    this.rel = e;
  };

  componentDidMount(): void {
    if (this.el && this.rel) {
      // use relevant style of parent for scaffolding div
      let bbox = this.el.getBoundingClientRect();
      Object.assign(this.rel.style, {
        position: 'absolute',
        left: `${bbox.left}px`,
        top: `${bbox.top}px`,
        width: `${bbox.width}px`,
        height: `${bbox.height}px`
      });
    }
  }

  render() {
    return (
      <>
        <div ref={this._setRef} style={SCAFFOLD}/>
        {ReactDOM.createPortal(
          // has tabIndex because now it is outside the container
          <div className="assisted-search-dropdown-parent" ref={this._setRel} tabIndex={-1}>
            {this.props.children}
          </div>,
          this.props.mount
        )}
      </>
    );
  }
}

const SCAFFOLD: CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  left: 0,
  top: 0,
  zIndex: -1
};
