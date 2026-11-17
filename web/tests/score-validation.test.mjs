import assert from 'node:assert/strict';
import test from 'node:test';
import { validateTurnResultForSubmission } from '../src/lib/scoreValidation.ts';

const result = {
  id: 'r1', round: 1, playerId: 'p1', playerName: 'Player',
  targetNumber: 4, rawTimeMs: 1500, penaltyMs: 2000,
  finalTimeMs: 3500, wrongTaps: 2,
};
const validate = (overrides = {}) => validateTurnResultForSubmission({
  result,
  penaltySeconds: 1,
  boardSize: 25,
  ...overrides,
});

test('valid human turn and penalties remain accepted', () => {
  assert.equal(validate().ok, true);
});

test('invalid board and penalty configuration are rejected', () => {
  for (const boardSize of [0, -1, 2.5, Infinity]) {
    assert.equal(validate({ boardSize }).ok, false);
  }
  for (const penaltySeconds of [-1, Infinity, NaN]) {
    assert.equal(validate({ penaltySeconds }).ok, false);
  }
});

test('invalid submitted time fields are rejected', () => {
  for (const patch of [
    { finalTimeMs: NaN }, { finalTimeMs: Infinity },
    { penaltyMs: -1 }, { penaltyMs: 1.5 },
  ]) {
    assert.equal(validate({ result: { ...result, ...patch } }).ok, false);
  }
});
