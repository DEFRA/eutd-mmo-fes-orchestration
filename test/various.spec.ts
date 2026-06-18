import * as test from 'tape';

import axios from '../src/helpers/axios';

test('loads axios', async (t) => {
  await t.equals(typeof axios, 'function');
  t.equal(true, true, 'various test assertion marker');
  return t.end();
});