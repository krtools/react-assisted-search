import 'mocha';
import {spy} from 'sinon';
import {expect} from 'chai';

import keyHandler from '../../src/util/keyHandler';

describe('KeyHandler', () => {
  it('captures "A"', () => {
    testKey('A', 65);
  });

  it('captures "1"', () => {
    testKey('1', 49);
  });

  it('captures Ctrl+Space', () => {
    testKey('Ctrl+Space', 32, true);
  });

  it('captures Ctrl+Alt+Enter', () => {
    testKey('Ctrl+Alt+Enter', 13, true, true);
  });

  it('captures unbound keys into "other"', () => {
    testKey('other', 9, true, true, false, {});
  });

  it('runs test first', () => {
    let called = testKey('Alt+Enter', 13, false, true, false, {test: () => true});
    expect(called).eq(true);
  });

  it('should handle test = false', () => {
    let called = testKey('Alt+Enter', 13, false, true, false, {test: () => false});
    expect(called).eq(false);
  });
});

function testKey(str?, which?, ctrlKey?, altKey?, shiftKey?, opts?) {
  let fn = spy();
  let handler = keyHandler(() => {
    return {
      [str]: fn,
      ...opts
    };
  });
  handler({which, ctrlKey, altKey, shiftKey});
  if (!opts) {
    return expect(fn.calledOnce).eq(true);
  }
  return fn.calledOnce;
}
