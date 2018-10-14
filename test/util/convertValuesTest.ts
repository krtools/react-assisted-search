import 'mocha';
import {omit, toEntry, toFacet, toOption, toOptions, toValue} from '../../src/util/convertValues';
import {expect} from 'chai';
import {DropdownOption, Facet, SearchEntry, Value} from '../../src/types';

describe('toEntry', () => {
  it('converts string', () => {
    expect(toEntry('a')).eql({value: {value: 'a'}} as SearchEntry);
    expect(toEntry('')).eql({value: {value: ''}} as SearchEntry);
  });

  it('leaves SearchEntry as is', () => {
    let entry = {value: {value: 'a'}} as SearchEntry;
    expect(toEntry(entry)).eq(entry);
  });

  it('converts Value type', () => {
    let value = {value: 'a'} as Value;
    expect(toEntry(value)).eql({value: {value: 'a'}} as SearchEntry);
  });
});

describe('toValue', () => {
  it('handles null', () => {
    expect(toValue(null)).eql({value: ''} as Value);
  });

  it('handles undefined', () => {
    expect(toValue(null)).eql({value: ''} as Value);
  });

  it('handles string', () => {
    expect(toValue('')).eql({value: ''} as Value);
    expect(toValue('a')).eql({value: 'a'} as Value);
  });

  it('handles object', () => {
    expect(toValue({value: 'a'} as Value)).eql({value: 'a'} as Value);
  });
});

describe('toFacet', () => {
  it('handles string', () => {
    expect(toFacet('')).eql({value: ''} as Facet);
    expect(toFacet('a')).eql({value: 'a'} as Facet);
  });

  it('handles Facet', () => {
    expect(toFacet({value: 'a'} as Facet)).eql({value: 'a'} as Facet);
  });
});

describe('toOption', () => {
  it('handles string', () => {
    expect(toOption('')).eql({value: ''} as DropdownOption);
    expect(toOption('a')).eql({value: 'a'} as DropdownOption);
  });

  it('handles DropdownOption', () => {
    expect(toOption({value: 'a'})).eql({value: 'a'} as DropdownOption);
  });
});

describe('toOptions', () => {
  it('handles array of strings', async () => {
    let opts: DropdownOption[] = await toOptions(['a']);
    expect(opts).eql([{value: 'a'}] as DropdownOption[]);
  });

  it('handles array of dropdown options', async () => {
    let opts: DropdownOption[] = await toOptions([{value: 'a'}]);
    expect(opts).eql([{value: 'a'}] as DropdownOption[]);
  });

  it('handles promise for strings', async () => {
    let opts: DropdownOption[] = await toOptions(Promise.resolve(['a']));
    expect(opts).eql([{value: 'a'}] as DropdownOption[]);
  });

  it('handles promise for dropdown options', async () => {
    let opts: DropdownOption[] = await toOptions(Promise.resolve([{value: 'a'}]));
    expect(opts).eql([{value: 'a'}] as DropdownOption[]);
  });

  it('handles promise for mixed types', async () => {
    let opts: DropdownOption[] = await toOptions(Promise.resolve([{value: 'a'}, 'b']));
    expect(opts).eql([{value: 'a'}, {value: 'b'}] as DropdownOption[]);
  });
});

describe('omit', () => {
  it('omits to empty', () => {
    expect(omit({a: 'b'}, 'a')).eql({});
    expect(omit({a: 'b'}, 'a', 'b')).eql({});
    expect(omit({a: 'b'}, ['a'])).eql({});
    expect(omit({a: 'b'}, ['a', 'b'])).eql({});
  });

  it('omits multiple', () => {
    expect(omit({a: 'b', c: 'd', d: 'e'}, 'a', 'd')).eql({c: 'd'});
    expect(omit({a: 'b', c: 'd', d: 'e'}, ['a', 'd'])).eql({c: 'd'});
  });

  it('omits w/ leftovers', () => {
    expect(omit({a: 'b', c: 'd'}, 'a')).eql({c: 'd'});
    expect(omit({a: 'b', c: 'd'}, ['a'])).eql({c: 'd'});
    expect(omit({a: 'b', c: 'd'}, ['a', 'b'])).eql({c: 'd'});
    expect(omit({a: 'b', c: 'd'}, ['a', 'b'])).eql({c: 'd'});
    expect(omit({a: 'b', c: 'd'}, 'a', 'b')).eql({c: 'd'});
  });
});
