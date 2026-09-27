import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCodename, hasClearance, levelFor, meritRank, questVisibleTo, sanitizeCodename } from '../src/core.js';

test('clearance levels rise inward', () => {
  assert.equal(levelFor('Outer Veil'), 1);
  assert.equal(levelFor('Inner Crescent'), 5);
  assert.equal(hasClearance({ ring: 'The Eclipse' }, 'Waning Ring'), true);
  assert.equal(hasClearance({ ring: 'Waxing Ring' }, 'The Eclipse'), false);
});

test('generated codenames avoid existing values', () => {
  const first = generateCodename([]);
  const second = generateCodename([first]);
  assert.notEqual(first, second);
});

test('codename sanitization removes Discord and markdown control chars', () => {
  assert.equal(sanitizeCodename('@**Night**#Fox'), 'NightFox');
});

test('quest visibility respects status and ring', () => {
  assert.equal(questVisibleTo({ ring: 'Inner Crescent' }, { status: 'active', clearance: 'The Eclipse' }), true);
  assert.equal(questVisibleTo({ ring: 'Inner Crescent' }, { status: 'complete', clearance: 'Outer Veil' }), false);
});

test('merit rank thresholds', () => {
  assert.equal(meritRank(0), 'Unproven');
  assert.equal(meritRank(35), 'Proven');
  assert.equal(meritRank(100), 'Exemplary');
});
