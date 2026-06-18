import * as test from 'tape';
import * as appInsights from 'applicationinsights';
const sinon = require('sinon');

import AzureAppInsights from '../src/azureAppInsights';
import ApplicationConfig from '../src/applicationConfig';

test('AzureAppInsights', (tester) => {
  let setupStub;
  let startStub;
  let completedSubtests = 0;

  const finishSubtest = () => {
    completedSubtests += 1;
    if (completedSubtests === 2) {
      tester.equal(completedSubtests, 2, 'AzureAppInsights runs both subtests');
      tester.end();
    }
  };

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
    t.equal(true, true, 'AzureAppInsights - should setup and start applicationinsights if instrumentationKey is present');
    t.end();
    finishSubtest();
  });

  tester.test('AzureAppInsights - should not initialise', (t) => {
    beforeEach();
    AzureAppInsights();
    t.assert(!setupStub.called);
    t.assert(!startStub.called);
    afterEach();
    t.end();
    finishSubtest();
  });
});
