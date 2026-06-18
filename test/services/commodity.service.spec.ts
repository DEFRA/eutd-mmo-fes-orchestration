import * as test from 'tape';
import * as jsonfile from 'jsonfile';
const sinon = require('sinon');
import CommodityService from '../../src/services/commodity.service';

test('CatchService.searchCC - Should return an array of commodity codes', async (t) => {
  try {
    const result = await CommodityService.searchCC();
    t.assert(Array.isArray(result), 'result should be an array');
    t.ok(result.length > 0, 'result should contain at least one commodity entry');
    t.ok(result.length <= 3, 'result should contain at most three commodity entries');

    const uniqueEntries = new Set(result.map((item) => JSON.stringify(item)));
    t.equals(uniqueEntries.size, result.length, 'result should not contain duplicate entries');

    result.forEach((item, index) => {
      const keys = Object.keys(item);
      t.equals(keys.length, 1, `entry ${index} should have exactly one commodity code key`);
      t.ok(/^CD\d{3}$/.test(keys[0]), `entry ${index} key should match commodity code pattern`);
      t.equal(typeof (item as any)[keys[0]], 'string', `entry ${index} value should be a string`);
    });
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('CatchService.searchCC - Should thrown an error if commodity codes cannot be read', async (t) => {
  let mockJsonFile;
  try {
    mockJsonFile = sinon.stub(jsonfile, 'readFile').yields(new Error('a'));
    let error;
    try {
      await CommodityService.searchCC();
    } catch (e) {
      error = e;
    }

    t.assert(error);
    t.equal(error instanceof Error, true, 'thrown object should be an Error');
    t.equals(error.message, 'Cannot readAll commodity codes');
    t.equals(mockJsonFile.calledOnce, true, 'readFile should be called exactly once');
    t.end();
  } catch (e) {
    t.end(e);
  } finally {
    if (mockJsonFile && mockJsonFile.restore) {
      mockJsonFile.restore();
    }
  }
});