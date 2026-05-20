import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeRiskScore, scoreToTier, INDICATORS } from '../src/lib/riskEngine.js';

const lowProfile = {
  daysPerMonth: 2,
  avgSessionMinutes: 20,
  nightPlayPercent: 0,
  wagerVariability: 'very_stable',
  weeklyTotalEuro: 20,
  chasingFrequency: 'never',
  cancelWithdrawalCount: 'never',
  depositsPerSession: 0,
  gameTypesCount: 1,
  failedStopAttempts: 'none',
  relationshipConflict: 'never',
  limitsSet: 'set_respected',
  riskAwareness: 'fully',
};

const mediumProfile = {
  ...lowProfile,
  daysPerMonth: 10,
  avgSessionMinutes: 75,
  nightPlayPercent: 20,
  weeklyTotalEuro: 120,
  wagerVariability: 'moderate',
  chasingFrequency: 'sometimes',
  cancelWithdrawalCount: '1_2',
  depositsPerSession: 2,
  gameTypesCount: 3,
  failedStopAttempts: 'once',
  relationshipConflict: 'rarely',
  limitsSet: 'none',
  riskAwareness: 'partially',
};

const highProfile = {
  daysPerMonth: 14,
  avgSessionMinutes: 100,
  nightPlayPercent: 32,
  wagerVariability: 'moderate',
  weeklyTotalEuro: 160,
  chasingFrequency: 'sometimes',
  cancelWithdrawalCount: '1_2',
  depositsPerSession: 2,
  gameTypesCount: 3,
  failedStopAttempts: 'once',
  relationshipConflict: 'sometimes',
  limitsSet: 'none',
  riskAwareness: 'partially',
};

const criticalProfile = {
  daysPerMonth: 25,
  avgSessionMinutes: 240,
  nightPlayPercent: 60,
  wagerVariability: 'very_variable',
  weeklyTotalEuro: 500,
  chasingFrequency: 'very_often',
  cancelWithdrawalCount: 'often',
  depositsPerSession: 8,
  gameTypesCount: 6,
  failedStopAttempts: 'many',
  relationshipConflict: 'often',
  limitsSet: 'set_violated',
  riskAwareness: 'no',
};

describe('riskEngine weights', () => {
  it('indicator weights sum to 100', () => {
    const sum = Object.values(INDICATORS).reduce((s, d) => s + d.weight, 0);
    assert.equal(sum, 100);
  });
});

describe('computeRiskScore tiers', () => {
  it('low profile scores ≤ 24 (Χαμηλός)', () => {
    const r = computeRiskScore(lowProfile);
    assert.ok(r.score <= 24, `expected low score, got ${r.score}`);
    assert.equal(r.tier, 'Χαμηλός');
    assert.equal(r.tierColor, 'green');
    assert.equal(r.breakdown.length, Object.keys(INDICATORS).length);
  });

  it('medium profile scores in Μέτριος band (25–49)', () => {
    const r = computeRiskScore(mediumProfile);
    assert.ok(r.score >= 25 && r.score <= 49, `expected medium, got ${r.score}`);
    assert.equal(r.tier, 'Μέτριος');
    assert.ok(r.recommendations.length >= 2);
  });

  it('high profile scores in Αυξημένος band (50–74)', () => {
    const r = computeRiskScore(highProfile);
    assert.ok(r.score >= 50 && r.score <= 74, `expected high band, got ${r.score}`);
    assert.equal(r.tier, 'Αυξημένος');
    assert.equal(r.topDrivers.length, 3);
  });

  it('critical profile scores ≥ 75 (Υψηλός) with resources', () => {
    const r = computeRiskScore(criticalProfile);
    assert.ok(r.score >= 75, `expected critical, got ${r.score}`);
    assert.equal(r.tier, 'Υψηλός');
    assert.equal(r.tierColor, 'red');
    assert.ok(Array.isArray(r.resources) && r.resources.length >= 1);
    const chasing = r.breakdown.find((b) => b.indicator === 'chasingFrequency');
    assert.ok(chasing && chasing.contribution >= 12);
  });
});

describe('scoreToTier boundaries', () => {
  it('maps boundary values correctly', () => {
    assert.equal(scoreToTier(0).tier, 'Χαμηλός');
    assert.equal(scoreToTier(24).tier, 'Χαμηλός');
    assert.equal(scoreToTier(25).tier, 'Μέτριος');
    assert.equal(scoreToTier(49).tier, 'Μέτριος');
    assert.equal(scoreToTier(50).tier, 'Αυξημένος');
    assert.equal(scoreToTier(74).tier, 'Αυξημένος');
    assert.equal(scoreToTier(75).tier, 'Υψηλός');
  });
});
