import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateSlackMinutesPayload, type CommitmentCandidate } from '@mc/contracts';
import { buildMinutes, type MeetingMeta } from '../src/minutes.js';
import { buildSlackMinutesPayload } from '../src/slack-payload.js';

const meta: MeetingMeta = JSON.parse(
  readFileSync(new URL('../../fixtures/orion-meeting-meta.json', import.meta.url), 'utf8'),
);
const commitments: CommitmentCandidate[] = [
  { who: 'Executive Office', what: 'Arrange innovation-zone workshop', due: '+14d', confidence: 0.95, verbatim: 'v', segmentSeq: 16 },
];

describe('buildSlackMinutesPayload', () => {
  const payload = buildSlackMinutesPayload(buildMinutes(meta, commitments), {
    channelId: 'C000TEST', taskBaseUrl: 'https://example.invalid/tasks',
  });
  it('is schema-valid', () => expect(validateSlackMinutesPayload(payload)).toBe(true));
  it('canvas contains EN and AR sections and a checklist item per action', () => {
    expect(payload.canvasMarkdown).toContain('## Summary');
    expect(payload.canvasMarkdown).toContain('## ملخص');
    expect(payload.canvasMarkdown).toContain('- [ ] **Executive Office** — Arrange innovation-zone workshop (due +14d)');
  });
  it('one task link per action item', () => {
    expect(payload.taskLinks).toEqual([
      { title: 'Executive Office: Arrange innovation-zone workshop', url: 'https://example.invalid/tasks/1' },
    ]);
  });
});
