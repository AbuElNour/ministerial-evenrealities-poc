import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  assertValid, validateCommitmentCandidate, validateMinutesDocument, validateSlackMinutesPayload,
  type CommitmentCandidate, type MinutesDocument, type SlackMinutesPayload, type TranscriptSegment,
} from '@mc/contracts';
import { MockExtractor } from './extractor.js';
import { buildMinutes, type MeetingMeta } from './minutes.js';
import { buildSlackMinutesPayload } from './slack-payload.js';
import { AGENDA_CARD, BRIEFING_CARDS } from './demo-cards.js';

export interface PipelineResult {
  commitments: CommitmentCandidate[];
  minutes: MinutesDocument;
  slackPayload: SlackMinutesPayload;
}

const FIXTURES = new URL('../../fixtures/', import.meta.url);

export function loadSegments(): TranscriptSegment[] {
  return JSON.parse(readFileSync(new URL('orion-meeting-transcript.json', FIXTURES), 'utf8'));
}

export function loadMeta(): MeetingMeta {
  return JSON.parse(readFileSync(new URL('orion-meeting-meta.json', FIXTURES), 'utf8'));
}

export function runLocalPipeline(): PipelineResult {
  const extractor = new MockExtractor();
  const commitments: CommitmentCandidate[] = [];
  for (const seg of loadSegments()) {
    const c = extractor.extract(seg);
    if (c) commitments.push(assertValid(validateCommitmentCandidate, c, `commitment@seq${seg.seq}`));
  }
  const minutes = assertValid(validateMinutesDocument, buildMinutes(loadMeta(), commitments), 'minutes');
  const slackPayload = assertValid(
    validateSlackMinutesPayload,
    buildSlackMinutesPayload(minutes, {
      channelId: process.env.SLACK_CHANNEL_ID ?? 'C000LOCAL',
      taskBaseUrl: 'https://example.invalid/tasks',
    }),
    'slackPayload',
  );
  return { commitments, minutes, slackPayload };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(baseUrl: string, path: string, body?: unknown): Promise<Response> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res;
}

export async function replayThroughBridge(
  baseUrl: string,
  opts: { realtime?: boolean } = {},
): Promise<{ flashes: number }> {
  await post(baseUrl, '/push', { cards: [AGENDA_CARD, ...BRIEFING_CARDS] });
  let flashes = 0;
  let prevEnd = 0;
  for (const seg of loadSegments()) {
    if (opts.realtime) await sleep(Math.max(0, seg.tStartMs - prevEnd));
    prevEnd = seg.tEndMs;
    const res = await post(baseUrl, '/transcript', seg);
    const body = (await res.json()) as { flash: boolean };
    if (body.flash) { flashes += 1; console.log(`  ⚡ flash at seq ${seg.seq}`); }
  }
  await post(baseUrl, '/end');
  console.log(`replay(bridge): done — ${flashes} flashes`);
  return { flashes };
}

function main(): void {
  const args = process.argv.slice(2);
  const bridgeIdx = args.indexOf('--bridge');
  if (bridgeIdx !== -1) {
    const url = args[bridgeIdx + 1];
    if (!url) { console.error('usage: replay --bridge <url> [--realtime]'); process.exit(2); }
    replayThroughBridge(url, { realtime: args.includes('--realtime') })
      .catch((err) => { console.error(err); process.exit(1); });
    return;
  }
  const result = runLocalPipeline();
  const outDir = new URL('../out/', import.meta.url);
  mkdirSync(fileURLToPath(outDir), { recursive: true });
  writeFileSync(new URL('commitments.json', outDir), JSON.stringify(result.commitments, null, 2));
  writeFileSync(new URL('minutes.json', outDir), JSON.stringify(result.minutes, null, 2));
  writeFileSync(new URL('slack-payload.json', outDir), JSON.stringify(result.slackPayload, null, 2));
  console.log(`replay: ${result.commitments.length} commitments extracted`);
  for (const c of result.commitments) console.log(`  seq ${c.segmentSeq}: [${c.who}] ${c.what} (due ${c.due})`);
  console.log(`replay: artifacts written to ${fileURLToPath(outDir)}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
