import type { CommitmentCandidate, MinutesDocument } from '@mc/contracts';

export interface MeetingMeta {
  meetingId: string; title: string; attendees: string[];
  keyPoints: string[]; decisions: string[]; summaryEn: string; summaryAr: string;
}

export function buildMinutes(meta: MeetingMeta, commitments: CommitmentCandidate[]): MinutesDocument {
  return {
    meetingId: meta.meetingId,
    title: meta.title,
    attendees: meta.attendees,
    keyPoints: meta.keyPoints,
    decisions: meta.decisions,
    actionItems: commitments.map((c) => ({ owner: c.who, what: c.what, due: c.due })),
    summaryEn: meta.summaryEn,
    summaryAr: meta.summaryAr,
  };
}
