import { readFileSync } from 'node:fs';
import type { CommitmentCandidate } from '@mc/contracts';
import { runLocalPipeline } from './replay.js';

interface ExpectedCommitment { segmentSeq: number; who: string; whatContains: string; due: string }
interface Expected { allOtherSegmentsExtractNothing: boolean; commitments: ExpectedCommitment[] }

export function checkAgainstExpected(commitments: CommitmentCandidate[]): { failures: string[] } {
  const expected: Expected = JSON.parse(
    readFileSync(new URL('../../fixtures/expected-extractions.json', import.meta.url), 'utf8'),
  );
  const failures: string[] = [];
  for (const exp of expected.commitments) {
    const hit = commitments.find((c) => c.segmentSeq === exp.segmentSeq);
    if (!hit) { failures.push(`MISSING: expected commitment at seq ${exp.segmentSeq}`); continue; }
    if (hit.who !== exp.who) failures.push(`WHO mismatch at seq ${exp.segmentSeq}: ${hit.who}`);
    if (!hit.what.toLowerCase().includes(exp.whatContains.toLowerCase()))
      failures.push(`WHAT mismatch at seq ${exp.segmentSeq}: "${hit.what}"`);
    if (hit.due !== exp.due) failures.push(`DUE mismatch at seq ${exp.segmentSeq}: ${hit.due}`);
    if (hit.confidence < 0.85) failures.push(`LOW CONFIDENCE at seq ${exp.segmentSeq}: ${hit.confidence}`);
  }
  const allowed = new Set(expected.commitments.map((e) => e.segmentSeq));
  // Check for duplicates at allowed seqs
  const countBySeq = new Map<number, number>();
  for (const c of commitments) {
    if (allowed.has(c.segmentSeq)) {
      countBySeq.set(c.segmentSeq, (countBySeq.get(c.segmentSeq) ?? 0) + 1);
    }
  }
  for (const [seq, count] of countBySeq) {
    if (count > 1) {
      failures.push(`DUPLICATE at seq ${seq}: ${count} commitments extracted`);
    }
  }
  for (const c of commitments) {
    if (!allowed.has(c.segmentSeq)) failures.push(`FALSE POSITIVE at seq ${c.segmentSeq}: "${c.verbatim}"`);
  }
  return { failures };
}

function main(): void {
  const { failures } = checkAgainstExpected(runLocalPipeline().commitments);
  if (failures.length === 0) {
    console.log('replay:check PASS — 3/3 commitments, 0 false positives');
    process.exit(0);
  }
  console.error('replay:check FAIL');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
