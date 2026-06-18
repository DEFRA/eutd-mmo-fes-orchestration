import * as test from 'tape';
import ApplicationConfig from '../../src/applicationConfig';
import {
  getStateByCode,
  getPresentationByCode,
  getSpeciesByFaoCode,
  getSpecies,
  getVessel
} from '../../src/services/reference-data.service';
import axios from 'axios';
const sinon = require('sinon');

const getTestDescription = (name) => `#reference-data.service.${name}`;

const mockData = {
  data: [{ value: 'FRE', label: 'FRESH' }]
};

const commonSuccessTest = (desc, path, callFunc, expectEqual, ...args) => test(getTestDescription(desc), async (t) => {
  try {
    const mockAxios = { get: sinon.fake.resolves(mockData) };
    const result = await callFunc(...args, mockAxios);
    t.assert(mockAxios.get.called);
    t.deepEquals(result, expectEqual);
    t.equals(mockAxios.get.callCount, 1, 'axios.get called exactly once');
    t.end();
  } catch (e) {
    t.end(e);
  }
});

const commonFailTest = (desc, path, callFunc, ...args) => test(getTestDescription(desc), async (t) => {
  try {
    const mockAxios = { get: sinon.fake.rejects(new Error('error')) };
    const result = await callFunc(...args, mockAxios);
    t.assert(mockAxios.get.called);
    t.equals(result.message, 'error');
    t.equals(mockAxios.get.callCount, 1, 'axios.get called exactly once on error');
    t.ok(result instanceof Error, 'result is an Error instance');
    t.end();
  } catch (e) {
    t.end(e);
  }
});

commonSuccessTest('getStateByCode', '/v1/states', getStateByCode, mockData.data[0], 'FRE');
commonFailTest('getStateByCode', '/v1/states', getStateByCode, ['FRE']);

commonSuccessTest('getSpeciesByFaoCode', '/v1/species/FRE', getSpeciesByFaoCode, mockData.data, 'FRE');
commonFailTest('getSpeciesByFaoCode', '/v1/species/FRE', getSpeciesByFaoCode, ['FRE']);

commonSuccessTest('getPresentationByCode', '/v1/presentations', getPresentationByCode, mockData.data[0], 'FRE');
commonFailTest('getPresentationByCode', '/v1/presentations', getPresentationByCode, 'FRE');

commonSuccessTest('getSpecies', '/v1/species/search', getSpecies, mockData.data, 'FRE');
commonFailTest('getSpecies', '/v1/species/search', getSpecies, 'FRE');

commonSuccessTest('getVessel', '/v1/vessels/search-exact', getVessel, mockData.data, 'PLN', 'FRE');
commonFailTest('getVessel', '/v1/vessels/search-exact', getVessel, 'PLN', 'FRE');
