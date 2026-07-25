import { describe, it, expect } from 'vitest';
import { runLocalPipeline } from '../src/replay.js';
import { checkAgainstExpected } from '../src/replay-check.js';

describe('runLocalPipeline', () => {
  const result = runLocalPipeline();
  it('extracts exactly 3 commitments', () => expect(result.commitments).toHaveLength(3));
  it('minutes carry 3 action items', () => expect(result.minutes.actionItems).toHaveLength(3));
  it('slack payload has 3 task links', () => expect(result.slackPayload.taskLinks).toHaveLength(3));
});

describe('checkAgainstExpected', () => {
  it('passes for the real pipeline output', () => {
    const { failures } = checkAgainstExpected(runLocalPipeline().commitments);
    expect(failures).toEqual([]);
  });
  it('fails when a commitment is missing', () => {
    const { failures } = checkAgainstExpected(runLocalPipeline().commitments.slice(0, 2));
    expect(failures.length).toBeGreaterThan(0);
  });
  it('fails on a false positive', () => {
    const extra = { ...runLocalPipeline().commitments[0], segmentSeq: 5 };
    const { failures } = checkAgainstExpected([...runLocalPipeline().commitments, extra]);
    expect(failures.length).toBeGreaterThan(0);
  });
  it('fails when a duplicate commitment appears at an allowed seq', () => {
    const base = runLocalPipeline().commitments;
    const { failures } = checkAgainstExpected([...base, { ...base[0] }]);
    expect(failures.length).toBeGreaterThan(0);
  });
});
