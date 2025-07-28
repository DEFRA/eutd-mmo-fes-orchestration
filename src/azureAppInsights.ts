import * as appInsights from 'applicationinsights';
import ApplicationConfig from './applicationConfig';

export default () => {
  const instrumentationKey = ApplicationConfig._instrumentationKey;

  if (instrumentationKey) {
    appInsights.setup(instrumentationKey)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true);
    appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = ApplicationConfig._cloudRoleName;
    appInsights.start();
    console.info(`Application Insights enabled for key: ${instrumentationKey}`);
  } else {
    console.info('Application Insights disabled');
  }
};
