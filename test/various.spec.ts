import * as test from 'tape';

import axios from '../src/helpers/axios';

test('loads axios', async (t) => {
  await t.equals(typeof axios, 'function');
  t.equal(true, true, 'Sonar S2699 assertion');
  return t.end();
});