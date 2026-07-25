import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateMinutesDocument, type CommitmentCandidate } from '@mc/contracts';
import { buildMinutes, type MeetingMeta } from '../src/minutes.js';

const meta: MeetingMeta = JSON.parse(
  readFileSync(new URL('../../fixtures/orion-meeting-meta.json', import.meta.url), 'utf8'),
);
const commitments: CommitmentCandidate[] = [
  { who: 'Orion Systems', what: 'Deliver readiness study', due: '2026-07-31', confidence: 0.95, verbatim: 'v1', segmentSeq: 10 },
  { who: 'Executive Office', what: 'Arrange innovation-zone workshop', due: '+14d', confidence: 0.95, verbatim: 'v3', segmentSeq: 16 },
];

describe('buildMinutes', () => {
  const minutes = buildMinutes(meta, commitments);
  it('produces a schema-valid MinutesDocument', () => expect(validateMinutesDocument(minutes)).toBe(true));
  it('maps each commitment to an action item (owner = who)', () => {
    expect(minutes.actionItems).toEqual([
      { owner: 'Orion Systems', what: 'Deliver readiness study', due: '2026-07-31' },
      { owner: 'Executive Office', what: 'Arrange innovation-zone workshop', due: '+14d' },
    ]);
  });
  it('carries the Arabic summary through untouched', () => expect(minutes.summaryAr).toBe(meta.summaryAr));
});
