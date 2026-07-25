import { Ajv, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import hudCardSchema from '../schemas/hud-card.schema.json';
import transcriptSegmentSchema from '../schemas/transcript-segment.schema.json';
import commitmentCandidateSchema from '../schemas/commitment-candidate.schema.json';
import minutesDocumentSchema from '../schemas/minutes-document.schema.json';
import slackMinutesPayloadSchema from '../schemas/slack-minutes-payload.schema.json';
import bridgeMessageSchema from '../schemas/bridge-message.schema.json';

// ---- Types (hand-maintained mirrors of the schemas) ----
export type HudCardType = 'agenda' | 'briefing' | 'live_summary' | 'commitment_flash' | 'close' | 'protocol_nudge';
export interface HudCard { type: HudCardType; line1: string; line2?: string; seq: number }

export interface TranscriptSegment {
  sessionId: string; seq: number; tStartMs: number; tEndMs: number;
  speaker: 'wearer' | 'visitor' | 'unknown'; text: string; final: boolean;
}

export interface CommitmentCandidate {
  who: 'Orion Systems' | 'Executive Office'; what: string; due: string;
  confidence: number; verbatim: string; segmentSeq: number;
}

export interface ActionItem { owner: string; what: string; due: string }
export interface MinutesDocument {
  meetingId: string; title: string; attendees: string[]; keyPoints: string[];
  decisions: string[]; actionItems: ActionItem[]; summaryEn: string; summaryAr: string;
}

export interface TaskLink { title: string; url: string }
export interface SlackMinutesPayload {
  channelId: string; message: string; canvasTitle: string; canvasMarkdown: string; taskLinks: TaskLink[];
}

export type InputEventName = 'tap' | 'double_tap' | 'swipe_up' | 'swipe_down';
export type InputSource = 'ring' | 'glasses' | 'sim' | 'unknown';
export type BridgeMessage =
  | { kind: 'hello'; sessionId: string }
  | { kind: 'hello_ack'; sessionId: string }
  | { kind: 'card'; card: HudCard }
  | { kind: 'input'; event: InputEventName; source: InputSource };

// ---- Validators ----
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
ajv.addSchema(hudCardSchema); // registered so bridge-message can $ref it

export const validateHudCard = ajv.compile<HudCard>(hudCardSchema) as ValidateFunction<HudCard>;
export const validateTranscriptSegment = ajv.compile<TranscriptSegment>(transcriptSegmentSchema);
export const validateCommitmentCandidate = ajv.compile<CommitmentCandidate>(commitmentCandidateSchema);
export const validateMinutesDocument = ajv.compile<MinutesDocument>(minutesDocumentSchema);
export const validateSlackMinutesPayload = ajv.compile<SlackMinutesPayload>(slackMinutesPayloadSchema);
export const validateBridgeMessage = ajv.compile<BridgeMessage>(bridgeMessageSchema);

export function assertValid<T>(validate: ValidateFunction<T>, data: unknown, label: string): T {
  if (!validate(data)) {
    throw new Error(`${label} failed validation: ${ajv.errorsText(validate.errors)}`);
  }
  return data as T;
}
