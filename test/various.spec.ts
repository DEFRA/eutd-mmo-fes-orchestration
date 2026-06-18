import * as test from 'tape';

import axios from '../src/helpers/axios';

test('loads axios', async (t) => {
  await t.equals(typeof axios, 'function');
  t.ok(axios, 'axios is defined and truthy');
  t.equals(typeof axios.get, 'function', 'axios.get method exists');
  return t.end();
});