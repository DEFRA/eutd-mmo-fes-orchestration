import * as test from 'tape';
import * as jsonfile from 'jsonfile';
const sinon = require('sinon');
import CommodityService from '../../src/services/commodity.service';

test('CatchService.searchCC - Should return an array of commodity codes', async (t) => {
  try {
    const result = await CommodityService.searchCC();
    t.assert(Array.isArray(result));
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('CatchService.searchCC - Should thrown an error if commodity codes cannot be read', async (t) => {
  try {
    const mockJsonFile = sinon.stub(jsonfile, 'readFile').yields(new Error('a'));
    let error;
    try {
      await CommodityService.searchCC();
    } catch (e) {
      error = e;
    }
    mockJsonFile.restore();
    t.assert(error);
    t.equals(error.message, 'Cannot readAll commodity codes');
    t.end();
  } catch (e) {
    t.end(e);
  }
});