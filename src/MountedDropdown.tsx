import * as React from 'react';
import {ClassAttributes, CSSProperties} from 'react';
import * as ReactDOM from 'react-dom';
import autoPosition from './util/autoPosition';
import {Nullable} from './types';

export interface MountedDropdownProps extends ClassAttributes<MountedDropdown> {
  mount: Nullable<HTMLElement>;
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
    this.reposition();
    window.addEventListener('resize', this.reposition);
  }

  componentDidUpdate(): void {
    this.reposition();
  }

  componentWillUnmount(): void {
    window.removeEventListener('resize', this.reposition);
  }

  reposition = () => {
    if (this.el && this.rel) {
      // use relevant style of parent for scaffolding div
      let bbox = this.el.getBoundingClientRect();
      Object.assign(this.rel.style, {
        position: 'fixed',
        left: `${bbox.left}px`,
        top: `${bbox.top}px`,
        width: `${bbox.width}px`,
        height: `${bbox.height}px`
      });

      let dd = this.rel.querySelector('.assisted-search-base-dropdown');
      if (dd) {
        autoPosition(dd, 'drop-up');
      }
    }
  };

  render() {
    let {children, mount} = this.props;
    let baseDropdown = React.Children.only(children);
    if (!mount) {
      return baseDropdown;
    }

    if (mount) {
      baseDropdown = ReactDOM.createPortal(
        // has tabIndex because now it is outside the container
        <div ref={this._setRel} tabIndex={-1} style={{pointerEvents:'none'}}>
          {baseDropdown}
        </div>,
        mount
      );
    }

    return (
      <>
        <div ref={this._setRef} style={SCAFFOLD} />
        {baseDropdown}
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
