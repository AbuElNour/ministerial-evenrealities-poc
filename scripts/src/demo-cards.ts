import type { CommitmentCandidate, HudCard } from '@mc/contracts';
import { truncateLine } from './summarizer.js';

export const AGENDA_CARD: HudCard = {
  type: 'agenda', seq: 0,
  line1: '4 meetings today',
  line2: 'Next: Orion Systems 10:00',
};

export const BRIEFING_CARDS: HudCard[] = [
  { type: 'briefing', seq: 1, line1: 'Alex Rivera — CEO', line2: 'Orion Systems, Example City' },
  { type: 'briefing', seq: 2, line1: 'Synthetic innovation pilot', line2: 'First review this cycle' },
  { type: 'briefing', seq: 3, line1: 'Last review: cycle 2', line2: 'OVERDUE: readiness study' },
  { type: 'briefing', seq: 4, line1: 'Ask: pilot decision timeline', line2: 'Offer: onboarding workshop' },
];

export const CLOSE_CARD: HudCard = {
  type: 'close', seq: 99,
  line1: 'Minutes sent · 3 actions logged',
  line2: 'Next: strategy review 14:00',
};

// Not wired in Phase 1 — used by the protocol-nudge timer in later plans.
export const NUDGE_CARD: HudCard = {
  type: 'protocol_nudge', seq: 98,
  line1: '5 min remaining',
  line2: 'Next: strategy review 14:00',
};

export function flashCardFor(c: CommitmentCandidate): HudCard {
  return {
    type: 'commitment_flash', seq: c.segmentSeq,
    line1: '✓ Commitment captured',
    line2: truncateLine(`${c.who === 'Executive Office' ? 'Office' : 'Orion'}: ${c.what}`),
  };
}
