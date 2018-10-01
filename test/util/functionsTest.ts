import 'mocha';
/*eslint no-console: 0*/
import {invokeAll} from '../../src/util/functions';
import {spy, stub} from 'sinon';
import {expect} from 'chai';

describe('functions', () => {
  describe('invokeAll', () => {
    it('invokes an array of functions', () => {
      let sp = spy();
      let sp2 = spy();
      invokeAll([sp, sp2], [1, 2]);
      expect(sp.calledWith(1, 2)).eq(true);
      expect(sp2.calledWith(1, 2)).eq(true);
    });

    it('skips nulls', () => {
      let sp = spy();
      let sp2 = spy();
      invokeAll([sp, null, sp2], [1, 2]);
      expect(sp.calledWith(1, 2)).eq(true);
      expect(sp2.calledWith(1, 2)).eq(true);
    });

    it('does not fail on non-array arg', () => {
      let sp = spy();
      invokeAll(sp as any, ['adsf', null]);
    });

    it('ignores errors by default', () => {
      let sp = stub().throws();
      expect(() => invokeAll([sp], [])).to.not.throw();
    });

    it('throws an error when ignoreErrors = false', () => {
      let sp = stub().throws();
      expect(() => invokeAll([sp], [], false)).to.throw();
    });
  });
});
