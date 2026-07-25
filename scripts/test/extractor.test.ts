import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import type { TranscriptSegment } from '@mc/contracts';
import { validateCommitmentCandidate, validateHudCard } from '@mc/contracts';
import { MockExtractor } from '../src/extractor.js';
import { mockSummary, truncateLine } from '../src/summarizer.js';

const segments: TranscriptSegment[] = JSON.parse(
  readFileSync(new URL('../../fixtures/orion-meeting-transcript.json', import.meta.url), 'utf8'),
);
const expected = JSON.parse(
  readFileSync(new URL('../../fixtures/expected-extractions.json', import.meta.url), 'utf8'),
);

describe('MockExtractor against the fixture (the demo gate)', () => {
  const extractor = new MockExtractor();
  const results = segments.map((s) => ({ seq: s.seq, c: extractor.extract(s) }));

  it('fires on exactly the expected segments', () => {
    const fired = results.filter((r) => r.c !== null).map((r) => r.seq);
    expect(fired).toEqual(expected.commitments.map((e: { segmentSeq: number }) => e.segmentSeq));
  });

  it('every fired commitment matches who/what/due and validates', () => {
    for (const exp of expected.commitments) {
      const hit = results.find((r) => r.seq === exp.segmentSeq)!.c!;
      expect(validateCommitmentCandidate(hit)).toBe(true);
      expect(hit.who).toBe(exp.who);
      expect(hit.what.toLowerCase()).toContain(exp.whatContains.toLowerCase());
      expect(hit.due).toBe(exp.due);
      expect(hit.confidence).toBeGreaterThanOrEqual(0.85);
    }
  });

  it('does not fire on non-final segments', () => {
    const seg = { ...segments[9], final: false };
    expect(extractor.extract(seg)).toBeNull();
  });
});

describe('mockSummary', () => {
  it('produces a valid live_summary card with ≤40-char lines', () => {
    const card = mockSummary(segments.slice(0, 7));
    expect(validateHudCard(card)).toBe(true);
    expect(card.type).toBe('live_summary');
  });
  it('truncateLine hard-caps at 40', () => {
    expect(truncateLine('x'.repeat(60)).length).toBe(40);
    expect(truncateLine('short')).toBe('short');
  });
});
