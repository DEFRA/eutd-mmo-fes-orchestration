import * as test from 'tape';

import { breakDownNameAndCode } from '../../src/helpers/name';

test('when parsing vessel coming from client if it follows the format then it should parse it correctly to name/pln', t => {
  const sampleVessel = 'abc (123)';
  const parsed = breakDownNameAndCode(sampleVessel);
  t.equals(parsed.name, 'abc', 'parsed vessel name matches');
  t.equals(parsed.code, '123', 'parsed vessel pln matches');
  t.end();
});

test('when parsing vessel coming from client if it does not follow the format then it should return null', t => {
  const sampleVessel = 'abc ';
  const parsed = breakDownNameAndCode(sampleVessel);
  t.equals(parsed, null, 'parsed vessel object is null as it does not follow expected format');
  t.end();
});