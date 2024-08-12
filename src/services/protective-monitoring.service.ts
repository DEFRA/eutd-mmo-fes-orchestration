/**
 * Using https://github.com/Azure/azure-sdk-for-js to provide the mechanism to interact with Azure EventHubs
 * Using @azure/event-hubs library
 */
import { EventHubProducerClient } from "@azure/event-hubs";
import * as moment from 'moment';
import ApplicationConfig from '../applicationConfig';
import logger from '../logger';



export const postEventData = async (
  user: string,
  message: string,
  info: string,
  ipAddress: string,
  priorityCode: number,
  sessionId: string,
  transactionMessage: string
): Promise<void> => {

  const connectionString = ApplicationConfig.getEventHubConnectionString();
  const eventHubName = ApplicationConfig.getEventHubNamespace();

  try {
    const client = new EventHubProducerClient(connectionString, eventHubName);

    await client.getPartitionIds();

    const eventData = {
      body: {
        'user': `IDM/${user}`,
        'datetime': moment.utc().toISOString(),
        'sessionid': sessionId,
        'application': 'FI001',
        'component': 'external app',
        'ip': ipAddress,
        'pmccode': '0703',
        'priority': priorityCode.toString(),
        'details': {
          'transactioncode': `0706-${transactionMessage}`,
          'message': message,
          'additionalinfo': info
        },
        'environment': getEnvironment(ApplicationConfig.getApplicationHost()),
        'version': '1.1'
      }
    };

    const eventDataBatch = await client.createBatch();
    const isAdded = eventDataBatch.tryAdd(eventData);

    isAdded && logger.info(`[PROTECTIVE-MONITORING-SERVICE][DATA][${JSON.stringify(eventData.body)}]`);

    await client.sendBatch(eventDataBatch);

    logger.info('[PROTECTIVE-MONITORING-SERVICE][DATA][SENT]');

    await client.close();

    logger.info('[PROTECTIVE-MONITORING-SERVICE][CLIENT-CLOSE]');

  } catch (err) {
    logger.error(`[PROTECTIVE-MONITORING-SERVICE][ERROR][${err}]`);
  }
}

export const getEnvironment = (applicationHost: string): string => {
  const host = applicationHost.toLocaleLowerCase();

  logger.info(`[PROTECTIVE-MONITORING-SERVICE][HOST][${host}]`);

  if (host.includes('localhost'))
    return 'localhost';
  else if (host.includes('snd'))
    return 'SND';
  else if (host.includes('tst'))
    return 'TST';
  else if (host.includes('pre'))
    return 'PRE';
  else
    return 'PRD';
}