import assert from 'node:assert/strict';
import test from 'node:test';
import { getFilterSuggestions } from '../dist/filter-expression.js';

const fields = [
  { key: 'status', type: 'text', values: ['active', 'paused', 'failed'] },
  { key: 'region', type: 'text', values: ['eu', 'us', 'ap'] },
  { key: 'lag', type: 'number' },
];
const prefixes = ['', 'lag=10 ', 'lag=10 OR ', '(lag=10 AND ', '((lag=10) ', 'region IN (eu, us) '];
const spaced = source => [source, source.replaceAll(' ', '\t'), source.replaceAll(' ', '\n'), source.replaceAll(' ', '\r\n')];

const malformed = [
  'status=active!',
  'status=active! region=unknown',
  'status=a!ctive',
  'status=active!status=paused',
  'region IN (eu us',
  'region IN (eu, us ap',
  'region IN (eu OR status=paused',
  'region IN (eu AND ',
  'region IN (eu (us',
  '(status=active! region=unknown',
  'region IN (e) status=active',
  'region IN (eu, u) status=act',
  'region IN (e] status=active',
  'region IN (eu,, u',
  'region IN (, u',
  'status="\\uZZZZ" region=e',
  'status="pa\\u00',
];
for (const prefix of prefixes) {
  for (const source of malformed.flatMap(spaced)) {
    test(`reject destructive completion: ${JSON.stringify(prefix + source)}`, () => {
      assert.deepEqual(getFilterSuggestions(prefix + source, fields), []);
      assert.deepEqual(getFilterSuggestions(prefix + source, fields, true), []);
    });
  }
}

// Each suggestion must keep everything before the completion range.
const completable = [
  ['region=e', 'region', 'region = eu'],
  ['status!', '', 'status != '],
  ['status !', '', 'status != '],
  ['status="pa', '', 'status = paused'],
  ['region IN (u', '', 'region IN (us, '],
  ['region IN (eu, u', 'region IN (eu,', 'region IN (eu, us, '],
  ['region IN (eu, "us", a', 'region IN (eu, "us",', 'region IN (eu, "us", ap, '],
  ['region IN [eu, u', 'region IN ', 'region IN (eu, us, '],
  ['(status=active OR reg', '(status=active OR ', '(status=active OR region '],
];
for (const prefix of prefixes) {
  for (const [source, kept, expected] of completable) {
    test(`complete within the final condition: ${JSON.stringify(prefix + source)}`, () => {
      const texts = getFilterSuggestions(prefix + source, fields).map(item => item.text);
      assert.ok(texts.includes(prefix + expected), texts.join(' | '));
      for (const text of texts) assert.ok(text.startsWith(prefix + kept), text);
    });
  }
}
