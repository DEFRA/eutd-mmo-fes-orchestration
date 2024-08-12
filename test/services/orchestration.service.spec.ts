import * as test from 'tape';
import logger from '../../src/logger';
import * as moment from 'moment';
import { spy, when } from 'ts-mockito';
const pdfService = require("mmo-ecc-pdf-svc");
const sinon = require('sinon');
import { SessionStoreFactory } from '../../src/session_store/factory';
import OrchestrationService from '../../src/services/orchestration.service';
import SaveAsDraftService from '../../src/services/saveAsDraft.service';
import DocumentNumberService from '../../src/services/documentNumber.service';
import {
  today,
  parseDate,
  cleanDate,
  validateDate,
  validateTodayOrInThePast,
  validateNumber,
  validatePositiveNumber,
  isPositiveWholeNumber,
  numberAsString,
  validateWhitespace
} from '../../src/services/orchestration.service';

test('orchestration.service today() returns today correctly', async t => {
  try {
    let result = today();
    t.equals(result, moment().format('DD/MM/YYYY'));
    t.end();
  } catch (e) {
    t.end(e);
  }

});

test('orchestration.service parseDate() returns date correctly', async t => {
  try {
    let result = parseDate('01/01/1970');
    t.equals(result.format, moment.unix(0).format);

    result = parseDate('1/1/1970');
    t.equals(result.format, moment.unix(0).format);

    result = parseDate('32/01/1970');
    t.equals(result.format, moment.unix(0).format);
    t.end();
  } catch (e) {
    t.end(e);
  }

});

test('orchestration.service cleanDate() returns date in correct format', async t => {
  try {
    let result = cleanDate('01/01/1970');
    t.equals(result, '01/01/1970');

    result = cleanDate('1/1/1970');
    t.equals(result, '01/01/1970');

    result = cleanDate('32/13/1970');
    t.equals(result, 'Invalid date');
    t.end();
  } catch (e) {
    t.end(e);
    logger.error(e);
  }
});

test('orchestration.service validateDate() validates dates correctly', async t => {
  try {
    let result = validateDate('01/01/2019');
    t.true(result);

    result = validateDate('1/01/2019');
    t.true(result);

    result = validateDate('01/1/2019');
    t.true(result);

    result = validateDate('32/1/2019');
    t.false(result);

    result = validateDate('1/13/2019');
    t.false(result);

    result = validateDate('1/13/xxxx');
    t.false(result);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('orchestration.service validateTodayOrInThePast() validates dates correctly', async t => {
    try {
      const today = moment().format('DD/MM/YYYY');
      const yesterday = moment().subtract(1, 'days').format('DD/MM/YYYY');
      const tommorrow = moment().add(1, 'days').format('DD/MM/YYYY');

      let result = validateTodayOrInThePast(today);
      t.true(result);

      result = validateTodayOrInThePast(yesterday);
      t.true(result);

      result = validateTodayOrInThePast(tommorrow);
      t.false(result);
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

  test('orchestration.service validateNumber() validates numbers correctly', async t => {
    try {
      let result = validateNumber('a');
      t.false(result);

      result = validateNumber(NaN);
      t.false(result);

      result = validateNumber('1.0e2');
      t.false(result);

      result = validateNumber('1');
      t.true(result);

      result = validateNumber('-1');
      t.true(result);

      result = validateNumber('0.1');
      t.true(result);
      t.end();
    } catch (e) {
      t.end(e);
      logger.error(e);
    }
  });

  test('orchestration.service validatePositiveNumber() validates numbers correctly', async t => {
    try {
      let result = validatePositiveNumber('-1');
      t.false(result);

      result = validatePositiveNumber('0');
      t.true(result);

      result = validatePositiveNumber('1');
      t.true(result);

      result = validatePositiveNumber('1.1');
      t.true(result);
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

  test('orchestration.service isPositiveWholeNumber() validates numbers correctly', async t => {
    try {

      let result = isPositiveWholeNumber('1');
      t.true(result);

      result = isPositiveWholeNumber('1.1');
      t.false(result);
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

  test('orchestration.service numberAsString() validates numbers correctly', async t => {
    try {

      let result = numberAsString('1');
      t.equals(result, '1');

      result = numberAsString('1.1');
      t.equals(result, '1.1');

      result = numberAsString(1);
      t.equals(result, '1');

      result = numberAsString(1.1);
      t.equals(result, '1.1');

      result = numberAsString('a');
      t.equals(result, 'NaN');

      result = numberAsString('NaN');
      t.equals(result, 'NaN');
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

test('orchestration.service validateWhitespace() identifies whitespace correctly', async t => {
  try {
    let result = validateWhitespace('NO_WHITESPACE');
    t.false(result);

    result = validateWhitespace(' WHITESPACE');
    t.false(result);

    result = validateWhitespace('WHITESPACE ');
    t.false(result);

    result = validateWhitespace('WHITE SPACE');
    t.false(result);

    result = validateWhitespace(' ');
    t.true(result);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

const mockReq: any = {
  app: { claims: { sub: 'foo' } },
  params: { redisKey: 'storageNotes'},
  query: {
    n: '/catchCertificate',
    c: '/create-processing-statement/add-consignment-details',
    saveAsDraftUrl: false,
    saveToRedisIfErrors: true,
    setOnValidationSuccess: true
  },
  headers: {
    accept: 'text/html'
  },
  payload: {
    errors: [],
    foo: 'bar'
  }
};

const getSessionStore = async () => {
  return await SessionStoreFactory.getSessionStore({});
}

test('OrchestrationService.get - should be empty', async (t) => {
  try {
    await getSessionStore();
    await OrchestrationService.get({ ...mockReq, params: { redisKey: 'foo' }}, (data: any) => {
      t.deepEqual(data, {});
      t.end();
    });
  } catch (e) {
    t.end(e);
  }
})

test('OrchestrationService.get Should be whats currently stored', async (t) => {
  try {
    const sessionStore = await getSessionStore();
    await sessionStore.writeAllFor(mockReq.app.claims.sub, mockReq.params.redisKey, 'foobar' as any);
    await OrchestrationService.get(mockReq, (data: any) => {
      t.equal(data, 'foobar');
      t.end();
    });
  } catch (e) {
    t.end(e);
  }
});

test('OrchestrationService.back', (t) => {
  const beforeEach = async () => {
    const sessionStore = await getSessionStore();;
    await sessionStore.writeAllFor(
      mockReq.app.claims.sub, mockReq.params.redisKey, { test: 'foobar', errors: ['test'] } as any
    );
    return sessionStore;
  };

  t.test('Delete an errors property', async (t2) => {
    try {
      await beforeEach();
      await OrchestrationService.back({ ...mockReq, headers: {}}, (data: any) => {
        t2.deepEqual(data, { test: 'foobar' });
        t2.end();
      });
    } catch (e) {
      t2.end(e);
    }
  });

  t.test('Delete an errors property non JS', async (t2) => {
    try {
      const sessionStore = await beforeEach();
      const responseMock = { redirect: sinon.fake() };
      await OrchestrationService.back({ ...mockReq }, responseMock);

      const data = await sessionStore.readAllFor(mockReq.app.claims.sub, mockReq.params.redisKey);
      t2.assert(responseMock.redirect.called);
      t2.deepEqual(data, { test: 'foobar' });
      t2.end();
    } catch (e) {
      t2.end(e);
    }

  });
});


test('OrchestrationService.saveAndValidate', (t) => {
  let addRoute;
  const beforeEach = async () => {
    await getSessionStore();
  };

  t.test('Removes errors from payload', async (t2) => {
    try {
      await beforeEach();
      const responseSpy = sinon.fake();
      await OrchestrationService.saveAndValidate({
        ...mockReq,
        headers: {},
        query: {
          ...mockReq.query,
          c: 'journey',
          setOnValidationSuccess: 'setOnValidationSuccess'
        }
      }, responseSpy);

      t2.assert(responseSpy.called);
      t2.deepEquals(responseSpy.getCall(0).args[0], { foo: 'bar', setOnValidationSuccess: true });
      t2.assert(addRoute.called);
      afterEach();
      t2.end();
    } catch (e) {
      t2.end(e);
    }
  });

  t.test('Returns an error if the handler finds them', async (t2) => {
    try {
      await beforeEach();
      const responseSpy = sinon.fake();
      await OrchestrationService.saveAndValidate({
        ...mockReq,
        headers: {},
        query: {
          ...mockReq.query,
        },
        payload: {}
      }, responseSpy);

      t2.assert(responseSpy.called);
      const data = responseSpy.getCall(0).args[0];
      t2.assert(data.errors);
      t2.assert(data.errorsUrl);
      await afterEach();
      t2.end();
    } catch (e) {
      t2.end(e);
    }
  });
});

test('OrchestrationService.generatePdf', (t) => {
  let generatePdfAndUpload;
  let documentNumberStub;
  const beforeEach = () => {
    generatePdfAndUpload = sinon.stub(pdfService, 'generatePdfAndUpload').resolves({ uri: 'pdf_foobar' });
    documentNumberStub = sinon.stub(DocumentNumberService, 'getDocument').resolves({ documentNumber: 'foo' });
  };

  const afterEach = () => {
    generatePdfAndUpload.restore();
    documentNumberStub.restore();
  };

  t.test('Should call pdfService.generatePdfAndUpload and return its URI', async (t2) => {
    try {
      const responseSpy = sinon.fake();
      beforeEach();
      await OrchestrationService.generatePdf({
        ...mockReq,
        headers: {},
        params: { redisKey: 'processingStatement'} },
        responseSpy
      );
      t2.assert(documentNumberStub.called);
      t2.assert(generatePdfAndUpload.called);
      t2.assert(responseSpy.called);
      t2.deepEquals(responseSpy.getCall(0).args[0], { uri: 'pdf_foobar', documentNumber: 'foo' });
      afterEach();
      t2.end();
    } catch (e) {
      t2.end(e);
    }
  });

  t.test('Should call pdfService.generatePdfAndUpload and return its URI in a redirect', async (t2) => {
    try {
      const responseSpy = { redirect: sinon.fake()};
      beforeEach();
      await OrchestrationService.generatePdf({ ...mockReq }, responseSpy);
      t2.assert(documentNumberStub.called);
      t2.assert(generatePdfAndUpload.called);
      t2.assert(responseSpy.redirect.called);
      t2.deepEquals(responseSpy.redirect.getCall(0).args[0], '/catchCertificate?uri=pdf_foobar&documentNumber=foo');
      afterEach();
      t2.end();
    } catch (e) {
      t2.end(e);
    }
  });

  t.test('Should return early if the redisKey doesnt map to a pdf type', async (t2) => {
    try {
      const responseSpy = sinon.fake();
      beforeEach();
      await OrchestrationService.generatePdf({ ...mockReq, headers: {}, params: { redisKey: 'foo' } }, responseSpy);
      t2.assert(!documentNumberStub.called);
      t2.deepEquals(responseSpy.getCall(0).args[0], { error: 'unsupported foo'});
      afterEach();
      t2.end();
    } catch (e) {
      t2.end(e);
    }
  });
});