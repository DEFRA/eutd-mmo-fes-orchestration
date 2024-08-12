import { validate } from './httpHelper';

const constructPath = () => {
  return `vesselName=some&vesselPln=123`
}

it('when validating vessel data against reference service it should return vehicle object if the vehicle exists in reference service', async () => {
  const mock = {
    get: async () => {
      return new Promise((res, _rej) => {
        res({data: {
            name: 'some',
            pln: '123'
            // other props of vessel we don't include it now
          }});
      });
    }
  } as any; // this cast to any is ok for testing mock instances

  const valid = await validate('some (123)', 'someScientificName', 'http://somebaseurl', 'vessel', constructPath, mock);
  expect(valid.isError).toBe(false);
});

it('when validating vessel data against reference service it should throw an error if the vehicle does not exist in reference service', async () => {
  const dummyError = 'This will be a 404 status code in actual service call if vessel does not exist';
  const mock = {
    get: async () => {
      return new Promise((res, rej) => {
        rej(new Error(dummyError));
      });
    }
  } as any; // this cast to any is ok for testing mock instances

  const valid = await validate(mock, 'someScientificName', 'http://somebaseurl', 'vessel', constructPath, mock);
  expect(valid.isError).toBe(true);
});

