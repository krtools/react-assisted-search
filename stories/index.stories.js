import 'babel-polyfill';
import React from 'react';

// for demo purpose only
import 'bootstrap/dist/css/bootstrap.css';
import {storiesOf} from '@storybook/react';

import FacetedLookup from './faceted/FacetedLookup';
import StateLookup from './unfaceted/StateLookup';
import SingleValueExample from './examples/SingleValueExample';
import MultiValueExample from './examples/MultiValueExample';
import Wrapper from './Wrapper';
import FacetedValueExample from './examples/FacetedValueExample';
import FilenameLookup from './examples/FilenameLookup';
import FacetedValueWithHashtag from './examples/FacetedValueWithHashtag';
import MultiValuePartial from './examples/MultiValuePartial';
import FacetedPartial from './faceted/FacetedPartial';

const Container = story => (
  <div className="container" style={{paddingTop: '20px'}}>
    <Wrapper>{story()}</Wrapper>
  </div>
);

const isState = facet => facet.value === 'state';
const notStartWithNumber = (v, s) => !/^\d/.test(s.input);

storiesOf('Single Value', module)
  .addDecorator(Container)
  .add('States', () => <StateLookup />)
  .add('State - Using Labels', () => {
    return (
      <div>
        <p>This example uses custom labels for the values after they have been selected.</p>
        <div>
          <StateLookup labels />
        </div>
      </div>
    );
  })
  .add('Custom Values', () => <StateLookup customValues />)
  .add('Rewriting Values', () => <StateLookup customValues rewriteValue />)
  .add('Custom MenuItem', () => <StateLookup customMenuItem />)
  .add('Custom Dropdown', () => <StateLookup customDropdown />)
  .add('customValues()', () => (
    <div>
      <p>This example allows custom values as long as the value does NOT start with a number</p>
      <StateLookup customValues={notStartWithNumber} />
    </div>
  ))
  .add('Auto Positioning', () => (
    <div style={{paddingTop: 700, paddingBottom: 700}}>
      <StateLookup />
    </div>
  ));

storiesOf('Multiple Value', module)
  .addDecorator(Container)
  .add('States', () => <StateLookup type="multiple" />)
  .add('States - No Duplicates', () => <StateLookup noDupes type="multiple" />)
  .add('Custom Values', () => <StateLookup customValues type="multiple" />)
  .add('Rewriting Values', () => <StateLookup customValues rewriteValue type="multiple" />)
  .add('customValues()', () => (
    <div>
      <p>This example allows custom values as long as the value does NOT start with a number</p>
      <StateLookup type="multiple" customValues={notStartWithNumber} />
    </div>
  ));

storiesOf('Faceted Values', module)
  .addDecorator(Container)
  .add('Countries/States', () => <FacetedLookup />)
  .add('Countries/States - Custom Values', () => <FacetedLookup customValues />)
  .add('Countries/States - Custom Values as Function', () => (
    <div>
      <div>In this example, custom values are allowed, but only for state facets.</div>
      <FacetedLookup customValues={isState} />
    </div>
  ))
  .add('Countries/States - Rewriting Values', () => <FacetedLookup customValues rewriteValue />)
  .add('Standalone Values', () => <FacetedLookup standalone />)
  .add('Custom Dropdown for State', () => <FacetedLookup standalone customDropdown />);

storiesOf('<SingleValue>', module)
  .addDecorator(Container)
  .add('Basic', () => <SingleValueExample />);

storiesOf('<MultiValue>', module)
  .addDecorator(Container)
  .add('Basic', () => <MultiValueExample />)
  .add('Partial Auto Complete', () => <MultiValuePartial />);

storiesOf('<FacetedValue>', module)
  .addDecorator(Container)
  .add('Basic', () => <FacetedValueExample />)
  .add('Partials', () => <FacetedPartial />)
  .add('Country/State/HashTag', () => <FacetedValueWithHashtag />);

storiesOf('other', module)
  .addDecorator(Container)
  .add('File Path', () => <FilenameLookup />);
