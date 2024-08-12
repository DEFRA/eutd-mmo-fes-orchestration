import ApplicationConfig from '../applicationConfig';
import * as SUT from "./protective-monitoring.service";
import logger from "../logger";
import { EventData, EventDataBatch, EventHubProducerClient, TryAddOptions } from '@azure/event-hubs';
import { AmqpAnnotatedMessage } from '@azure/core-amqp';
jest.mock('@azure/event-hubs');

const moment = require('moment');
const time = moment().valueOf();

const user = "user",
  message = "message",
  info = "info",
  ipAddress = "ip-address",
  priorityCode = 9,
  sessionid = "sessionId",
  transactionMessage = "VIEW-CC";

describe("postEventData", () => {
  let mockLoggerError;
  let mockLoggerInfo;
  let mockGetApplicationHost;
  let mockGetPartitionIds;
  let mockSend;
  let mockClose;
  let mockCreateBatch;

  beforeEach(() => {
    mockGetApplicationHost = jest.spyOn(ApplicationConfig, 'getApplicationHost');
    mockGetApplicationHost.mockImplementation(() => 'localhost');

    class mockEventDataBatch implements EventDataBatch {
      sizeInBytes: number;
      count: number;
      maxSizeInBytes: number;
      tryAdd(_eventData: EventData | AmqpAnnotatedMessage, _options?: TryAddOptions | undefined): boolean {
        return true;
      }
    }
    const eventBatch: EventDataBatch = new mockEventDataBatch();

    mockGetPartitionIds = jest
      .spyOn(EventHubProducerClient.prototype, 'getPartitionIds')
      .mockImplementation(() => Promise.resolve(['123']));
    mockSend = jest
      .spyOn(EventHubProducerClient.prototype, 'sendBatch')
      .mockImplementation(() => Promise.resolve());
    mockClose = jest
      .spyOn(EventHubProducerClient.prototype, 'close')
      .mockImplementation(() => Promise.resolve());
    mockCreateBatch = jest
      .spyOn(EventHubProducerClient.prototype, 'createBatch')
      .mockImplementation(() => Promise.resolve(eventBatch));

    mockLoggerError = jest.spyOn(logger, "error");
    mockLoggerInfo = jest.spyOn(logger, "info");
    moment.now = jest.fn().mockReturnValue(time);
  });

  afterEach(() => {
    mockSend.mockRestore();
    mockGetPartitionIds.mockRestore();
    mockClose.mockRestore();
    mockCreateBatch.mockRestore();
    jest.restoreAllMocks();
  });

  it("should call `EventHubProducerClient` with the correct parameters", async () => {
    await SUT.postEventData(user, message, info, ipAddress, priorityCode, sessionid, transactionMessage);

    expect(EventHubProducerClient).toHaveBeenCalled();
    expect(EventHubProducerClient).toHaveBeenCalledWith(
      ApplicationConfig.eventHubConnectionString,
      ApplicationConfig.eventHubNamespace
    );
  });

  it("should log an error on throwing an exception", async () => {
    mockGetPartitionIds = jest
      .spyOn(EventHubProducerClient.prototype, 'getPartitionIds').mockRejectedValue(new Error('error'));
    await SUT.postEventData(user, message, info, ipAddress, priorityCode, sessionid, transactionMessage);
    expect(mockGetPartitionIds).toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith("[PROTECTIVE-MONITORING-SERVICE][ERROR][Error: error]");
  });

  it("should call `getPartitionIds`, `send` and `close` with the right params", async () => {
    mockGetPartitionIds = jest
      .spyOn(EventHubProducerClient.prototype, 'getPartitionIds')
      .mockImplementation(() => Promise.resolve(['567']));
    const expected: any = {
      body: {
        user: 'IDM/user',
        datetime: moment.utc(time).toISOString(),
        sessionid: 'sessionId',
        application: 'FI001',
        component: 'external app',
        ip: 'ip-address',
        pmccode: "0703",
        priority: "9",
        details: {
          transactioncode: '0706-VIEW-CC',
          message: "message",
          additionalinfo: "info"
        },
        environment: "localhost",
        version: "1.1"
      }
    };

    await SUT.postEventData(user, message, info, ipAddress, priorityCode, sessionid, transactionMessage);
    expect(mockGetPartitionIds).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, `[PROTECTIVE-MONITORING-SERVICE][HOST][localhost]`);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, `[PROTECTIVE-MONITORING-SERVICE][DATA][${JSON.stringify(expected.body)}]`);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(3, '[PROTECTIVE-MONITORING-SERVICE][DATA][SENT]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(4, '[PROTECTIVE-MONITORING-SERVICE][CLIENT-CLOSE]');


    expect(mockSend).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });
});

describe("getEnvironment", () => {
  it('will return `localhost` as an environment', () => {
    expect(SUT.getEnvironment('localhost')).toBe('localhost');
  });

  it('will return `SND` as an environment', () => {
    expect(SUT.getEnvironment('https://ukecc-snd.azure.defra.cloud/')).toBe('SND');
  });

  it('will return `TST` as an environment', () => {
    expect(SUT.getEnvironment('https://ukecc-tst.azure.defra.cloud/')).toBe('TST');
    expect(SUT.getEnvironment('https://ukecc-tst-blue.azure.defra.cloud/')).toBe('TST');
    expect(SUT.getEnvironment('https://ukecc-tst-green.azure.defra.cloud/')).toBe('TST');
  });

  it('will return `PRE` as an environment', () => {
    expect(SUT.getEnvironment('https://ukecc-PRE.azure.defra.cloud/')).toBe('PRE');
    expect(SUT.getEnvironment('https://ukecc-PREMO.azure.defra.cloud/')).toBe('PRE');
  });

  it('will return `PRD` as an environment', () => {
    expect(SUT.getEnvironment('https://ukecc.azure.defra.cloud/')).toBe('PRD');
  });
});