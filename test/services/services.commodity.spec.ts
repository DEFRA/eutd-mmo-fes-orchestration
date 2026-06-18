import Service from '../../src/services/commodity.service';
import * as test from 'tape';

test('it correctly returns commodity codes', async (t) => {
  const result = await Service.searchCC();
  // t.deepEqual(result.length, 3);
  t.ok(Array.isArray(result), 'result is an array');
  t.ok(result.length > 0, 'result has at least one item');
  t.deepEqual(typeof result[0], 'object');
  t.end();
});
