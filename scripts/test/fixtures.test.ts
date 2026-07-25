import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateTranscriptSegment, type TranscriptSegment } from '@mc/contracts';

const segments: TranscriptSegment[] = JSON.parse(
  readFileSync(new URL('../../fixtures/orion-meeting-transcript.json', import.meta.url), 'utf8'),
);
const expected = JSON.parse(
  readFileSync(new URL('../../fixtures/expected-extractions.json', import.meta.url), 'utf8'),
);

describe('synthetic Orion transcript fixture', () => {
  it('every segment validates against the schema', () => {
    for (const seg of segments) {
      expect(validateTranscriptSegment(seg), JSON.stringify(seg)).toBe(true);
    }
  });
  it('timestamps are monotonic and seq is 1..N contiguous', () => {
    segments.forEach((s, i) => {
      expect(s.seq).toBe(i + 1);
      if (i > 0) expect(s.tStartMs).toBeGreaterThanOrEqual(segments[i - 1].tEndMs);
    });
  });
  it('contains the three verbatim must-fire lines at the expected seqs', () => {
    expect(segments[9].text).toBe('We will deliver the readiness study by the end of July.');
    expect(segments[12].text).toBe('We are committing forty engineers to the Example City pilot starting September.');
    expect(segments[15].text).toBe('The executive office will arrange the innovation-zone workshop within two weeks.');
  });
  it('expected-extractions references exactly those seqs', () => {
    expect(expected.commitments.map((c: { segmentSeq: number }) => c.segmentSeq)).toEqual([10, 13, 16]);
    expect(expected.allOtherSegmentsExtractNothing).toBe(true);
  });
});
