import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFilterExpression, serializeFilterExpression, getFilterSuggestions } from '../dist/filter-expression.js';

const fields = [
  { key: 'status', type: 'text', values: ['active', 'paused', 'failed'] },
  { key: 'region', type: 'text', values: ['us', 'eu'] },
  { key: 'lag', type: 'number' },
  { key: 'owner', type: 'text', nullable: true, values: undefined },
];
const parse = (text, options) => {
  const result = parseFilterExpression(text, fields, options);
  assert.equal(result.ok, true, result.error);
  return result.value;
};

test('preserves nested Boolean groups, incoming joins, and typed IN values', () => {
  const nodes = parse('(status=active OR (status=failed AND lag>=100)) AND region IN (us, eu, )');
  assert.equal(nodes[0].kind, 'group');
  assert.equal(nodes[0].children[1].join, 'OR');
  assert.equal(nodes[0].children[1].children[1].value, 100);
  assert.deepEqual(nodes[1].value, ['us', 'eu']);
  assert.deepEqual(parse(serializeFilterExpression(nodes)), nodes);
  assert.equal(parse('OR (status=paused)', { allowLeadingJoin: true })[0].join, 'OR');
});

test('the suggestion sequence can close IN after its automatically appended comma', () => {
  let draft = getFilterSuggestions('region IN (u', fields).find(item => item.label === 'us').text;
  draft = getFilterSuggestions(draft + 'e', fields).find(item => item.label === 'eu').text;
  assert.deepEqual(parse(draft + ')')[0].value, ['us', 'eu']);
  assert.deepEqual(parse('lag IN [1, -2.5, 1, ]')[0].value, [1, -2.5]);
  assert.deepEqual(parse('owner IN ("Doe, Jane", ")", "", )')[0].value, ['Doe, Jane', ')', '']);
});

test('incomplete input and malformed groups never return a partial expression', () => {
  for (const source of ['status=active AND', '(status=active', 'status=active)', '()',
    '(OR status=active)', '(status=active OR)', 'region IN ()', 'region IN (us,,eu)',
    'region IN (us,', 'region IN (us, ]', 'owner="unfinished', 'lag=NaN', 'lag=Infinity',
    'lag=0x20', 'status=unknown', 'missing=active', 'region>eu', 'status IS NULL']) {
    const result = parseFilterExpression(source, fields);
    assert.equal(result.ok, false, source);
    assert.equal(result.value, undefined, source);
  }
  assert.deepEqual(parse(''), []);
});

test('serialization preserves quoted values, reserved words, escapes, and empty strings', () => {
  for (const value of ['OR', 'AND', 'Doe, Jane', '(eu)', '', 'a"b', "a'b", 'C:\\logs\\a', 'line\nnext', '\u0000']) {
    const nodes = [{ kind: 'condition', field: 'owner', operator: '=', value, join: 'AND' }];
    assert.deepEqual(parse(serializeFilterExpression(nodes)), nodes, JSON.stringify(value));
  }
});

test('completion retains outer expressions and commas inside quoted values', () => {
  const withOwners = [...fields.filter(field => field.key !== 'owner'), { key: 'owner', type: 'text', values: ['Doe, Jane', 'Mina'] }];
  assert.ok(getFilterSuggestions('(status=active OR reg', fields).some(item => item.text === '(status=active OR region '));
  const result = getFilterSuggestions('owner IN ("Doe, Jane", M', withOwners).find(item => item.label === 'Mina');
  assert.equal(result.text, 'owner IN ("Doe, Jane", Mina, ');
  assert.deepEqual(parse(result.text + ')')[0].value, ['Doe, Jane', 'Mina']);
});

test('schema restricts operators and known values without executing input', () => {
  const limited = [{ key: 'name', type: 'text', operators: ['='], values: ['alpha'] }];
  assert.equal(parseFilterExpression('name CONTAINS alpha', limited).ok, false);
  assert.equal(parseFilterExpression('name=beta', limited).ok, false);
  assert.equal(parse('owner IS NULL')[0].value, null);
  assert.equal(parse('owner="x\'; DROP TABLE items; --"')[0].value, "x'; DROP TABLE items; --");
  assert.equal(parseFilterExpression('('.repeat(70) + 'status=active' + ')'.repeat(70), fields).ok, false);
});
