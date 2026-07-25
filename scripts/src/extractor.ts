import type { TranscriptSegment, CommitmentCandidate } from '@mc/contracts';

export interface Extractor {
  extract(segment: TranscriptSegment): CommitmentCandidate | null;
}

interface Rule {
  pattern: RegExp;
  who: CommitmentCandidate['who'];
  what: string;
  due: string;
}

// Deterministic rules keyed to newly written synthetic replay data. This is a
// local test double for validating the surrounding agent workflow.
const RULES: Rule[] = [
  {
    pattern: /we will deliver the readiness study by the end of july/i,
    who: 'Orion Systems',
    what: 'Deliver readiness study',
    due: '2026-07-31',
  },
  {
    pattern: /committing forty engineers to the example city pilot starting september/i,
    who: 'Orion Systems',
    what: 'Commit 40 engineers to Example City pilot',
    due: '2026-09',
  },
  {
    pattern: /the executive office will arrange the innovation-zone workshop within two weeks/i,
    who: 'Executive Office',
    what: 'Arrange innovation-zone workshop',
    due: '+14d',
  },
];

export class MockExtractor implements Extractor {
  extract(segment: TranscriptSegment): CommitmentCandidate | null {
    if (!segment.final) return null;
    // First matching rule wins; rules are mutually exclusive for the scripted demo.
    for (const rule of RULES) {
      if (rule.pattern.test(segment.text)) {
        return {
          who: rule.who,
          what: rule.what,
          due: rule.due,
          confidence: 0.95,
          verbatim: segment.text,
          segmentSeq: segment.seq,
        };
      }
    }
    return null;
  }
}
