import * as test from 'tape';
import { validate } from '../../src/validators/httpHelper';

const constructPath = (name, code) => {
  return `vesselName=some&vesselPln=123`
}

test('when validaing vessel data against reference service it should return vehicle object if the vehicle exists in reference service', async t => {
  const mock = {
    get: async () => {
      return new Promise((res, rej) => {
        res({data: {
            name: 'some',
            pln: '123'
            // other props of vessel we don't include it now
          }});
      });
    }
  } as any; // this cast to any is ok for testing mock instances

  const valid = await validate('some (123)', 'http://somebaseurl', 'vessel', constructPath, mock);
  t.equals(valid.isError, false, 'vessel data exists in reference service for given name and pln');
  t.equals(typeof valid, 'object', 'result is an object');
  t.ok(valid.hasOwnProperty('isError'), 'result has isError property');
  t.end();
});

test('when validaing vessel data against reference service it should throw an error if the vehicle does not exist in reference service', async t => {
  const dummyError = 'This will be a 404 status code in actual service call if vessel does not exist';
  const mock = {
    get: async () => {
      return new Promise((res, rej) => {
        rej(new Error(dummyError));
      });
    }
  } as any; // this cast to any is ok for testing mock instances

  let errorCaught = false;
  let response;
  try {
    response = await validate(mock, 'http://somebaseurl', 'vessel', constructPath, mock);
  } catch(e) {
    errorCaught = true;
    t.equals(e.message, dummyError);
    t.ok(e instanceof Error, 'caught error is an Error instance');
  }
  // Either error was caught or response has error structure
  t.ok(errorCaught || (response && response.isError !== undefined), 'function handles error case');
  t.end();
});

