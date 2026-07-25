import type { TranscriptSegment, HudCard } from '@mc/contracts';

export const MAX_LINE = 40;

export function truncateLine(s: string, max: number = MAX_LINE): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

// Mock rolling summary: headline + last utterance. Replaced by the
// LiveSummarize prompt template in Plan 2 behind the same signature.
export function mockSummary(recent: TranscriptSegment[]): HudCard {
  const last = recent[recent.length - 1];
  return {
    type: 'live_summary',
    line1: 'Orion pilot discussion',
    line2: truncateLine(last?.text ?? '…'),
    seq: last?.seq ?? 0,
  };
}
