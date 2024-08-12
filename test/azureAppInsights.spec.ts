import * as test from 'tape';
import * as appInsights from 'applicationinsights';
const sinon = require('sinon');

import AzureAppInsights from '../src/azureAppInsights';
import ApplicationConfig from '../src/applicationConfig';

test('AzureAppInsights', (tester) => {
  let setupStub;
  let startStub;
  const beforeEach = () => {
    setupStub = sinon.stub(appInsights, 'setup');
    startStub = sinon.stub(appInsights, 'start');
  };
  const afterEach = () => {
    setupStub.restore();
    startStub.restore();
  };
  tester.test('AzureAppInsights - should setup and start applicationinsights if instrumentationKey is present', (t) => {
    const currentKey = ApplicationConfig._instrumentationKey;
    ApplicationConfig._instrumentationKey = 'foo';
    beforeEach();
    AzureAppInsights();
    t.assert(setupStub.called);
    t.assert(startStub.called);
    afterEach();
    ApplicationConfig._instrumentationKey = currentKey;
    t.end();
  });

  tester.test('AzureAppInsights - should not initialise', (t) => {
    beforeEach();
    AzureAppInsights();
    t.assert(!setupStub.called);
    t.assert(!startStub.called);
    afterEach();
    t.end();
  });
});
