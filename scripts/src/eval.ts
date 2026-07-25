import { mkdirSync, writeFileSync } from 'node:fs';
import { MockExtractor } from './extractor.js';
import type { TranscriptSegment } from '@mc/contracts';

const CASES: Array<{ text: string; final?: boolean; expected: string | null }> = [
  { text: 'We will deliver the readiness study by the end of July.', expected: 'Orion Systems' },
  { text: 'WE WILL DELIVER THE READINESS STUDY BY THE END OF JULY!', expected: 'Orion Systems' },
  { text: 'We are committing forty engineers to the Example City pilot starting September.', expected: 'Orion Systems' },
  { text: 'The executive office will arrange the innovation-zone workshop within two weeks.', expected: 'Executive Office' },
  { text: 'We will deliver the readiness study by the end of July.', final: false, expected: null },
  { text: 'We may deliver a study later.', expected: null },
  { text: 'The board discussed staffing.', expected: null },
  { text: 'No commitment has been made.', expected: null },
  { text: 'We are evaluating the research partnership.', expected: null },
  { text: 'The pilot is interesting.', expected: null },
  { text: 'Please show the next briefing card.', expected: null },
  { text: 'The workshop may be useful.', expected: null },
  { text: 'Forty engineers attended the meeting.', expected: null },
  { text: 'The study was reviewed last month.', expected: null },
  { text: 'Could you arrange a future workshop?', expected: null },
  { text: 'We will not commit to a deadline.', expected: null },
  { text: 'Example City is a fictional location.', expected: null },
  { text: 'The transcript contains no action.', expected: null },
  { text: 'Thank you for the meeting.', expected: null },
  { text: 'End the synthetic session.', expected: null },
];

const extractor = new MockExtractor();
const outcomes: Array<Record<string, unknown>> = [];
const latencies: number[] = [];

for (const [caseIndex, item] of CASES.entries()) {
  for (let trial = 1; trial <= 3; trial += 1) {
    const segment: TranscriptSegment = {
      sessionId: 'synthetic-eval',
      seq: caseIndex + 1,
      tStartMs: caseIndex * 1000,
      tEndMs: caseIndex * 1000 + 500,
      speaker: 'visitor',
      text: item.text,
      final: item.final ?? true,
    };
    const started = performance.now();
    const result = extractor.extract(segment);
    latencies.push(performance.now() - started);
    const actual = result?.who ?? null;
    outcomes.push({ case: caseIndex + 1, trial, expected: item.expected, actual, passed: actual === item.expected });
  }
}

const sorted = [...latencies].sort((a, b) => a - b);
const passed = outcomes.filter((item) => item.passed).length;
const report = {
  mode: 'deterministic-offline',
  cases: CASES.length,
  trials: outcomes.length,
  passed,
  successRate: passed / outcomes.length,
  p50LatencyMs: Number(sorted[Math.floor(sorted.length * 0.5)].toFixed(3)),
  p95LatencyMs: Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(3)),
  estimatedCostUsd: 0,
  outcomes,
};

mkdirSync(new URL('../../evals/', import.meta.url), { recursive: true });
writeFileSync(new URL('../../evals/results.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report, outcomes: undefined }, null, 2));
if (report.successRate !== 1) process.exit(1);
