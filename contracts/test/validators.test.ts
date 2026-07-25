import { describe, it, expect } from 'vitest';
import {
  validateHudCard, validateTranscriptSegment, validateCommitmentCandidate,
  validateMinutesDocument, validateSlackMinutesPayload, validateBridgeMessage,
  assertValid,
} from '../src/index.js';

const goodCard = { type: 'agenda', line1: '4 meetings today', line2: 'Next: Orion 10:00', seq: 1 };

describe('HudCard', () => {
  it('accepts a valid card', () => expect(validateHudCard(goodCard)).toBe(true));
  it('rejects a 41-char line', () =>
    expect(validateHudCard({ ...goodCard, line1: 'x'.repeat(41) })).toBe(false));
  it('rejects unknown type', () =>
    expect(validateHudCard({ ...goodCard, type: 'popup' })).toBe(false));
  it('rejects extra properties', () =>
    expect(validateHudCard({ ...goodCard, color: 'red' })).toBe(false));
});

describe('TranscriptSegment', () => {
  const seg = { sessionId: 'demo', seq: 1, tStartMs: 0, tEndMs: 4000, speaker: 'wearer', text: 'Welcome.', final: true };
  it('accepts a valid segment', () => expect(validateTranscriptSegment(seg)).toBe(true));
  it('rejects bad speaker', () => expect(validateTranscriptSegment({ ...seg, speaker: 'chair' })).toBe(false));
});

describe('CommitmentCandidate', () => {
  const c = { who: 'Executive Office', what: 'Arrange workshop', due: '+14d', confidence: 0.95, verbatim: 'The office will arrange…', segmentSeq: 16 };
  it('accepts valid', () => expect(validateCommitmentCandidate(c)).toBe(true));
  it('rejects who outside enum', () => expect(validateCommitmentCandidate({ ...c, who: 'Acme' })).toBe(false));
  it('rejects confidence > 1', () => expect(validateCommitmentCandidate({ ...c, confidence: 1.2 })).toBe(false));
});

describe('MinutesDocument + SlackMinutesPayload', () => {
  const minutes = {
    meetingId: 'SYNTH-ORION-2026-07', title: 'Orion Systems — Innovation Pilot',
    attendees: ['Executive Chair', 'Alex Rivera'], keyPoints: ['Site assessment reviewed'],
    decisions: ['Q4 decision timeline confirmed'],
    actionItems: [{ owner: 'Executive Office', what: 'Onboarding workshop', due: '+14d' }],
    summaryEn: 'Productive meeting.', summaryAr: 'اجتماع مثمر.',
  };
  it('accepts valid minutes', () => expect(validateMinutesDocument(minutes)).toBe(true));
  it('accepts valid slack payload', () => expect(validateSlackMinutesPayload({
    channelId: 'C123', message: 'Minutes posted', canvasTitle: 'Minutes — Orion',
    canvasMarkdown: '# Minutes', taskLinks: [{ title: 'Task 1', url: 'https://example.invalid/t/1' }],
  })).toBe(true));
});

describe('BridgeMessage', () => {
  it('accepts hello', () => expect(validateBridgeMessage({ kind: 'hello', sessionId: 'demo' })).toBe(true));
  it('accepts card', () => expect(validateBridgeMessage({ kind: 'card', card: goodCard })).toBe(true));
  it('accepts input', () => expect(validateBridgeMessage({ kind: 'input', event: 'tap', source: 'sim' })).toBe(true));
  it('rejects unknown kind', () => expect(validateBridgeMessage({ kind: 'nope' })).toBe(false));
});

describe('assertValid', () => {
  it('returns data when valid', () => expect(assertValid(validateHudCard, goodCard, 'card')).toEqual(goodCard));
  it('throws with label when invalid', () =>
    expect(() => assertValid(validateHudCard, { type: 'agenda' }, 'card')).toThrow(/card/));
});
