import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import { validateBridgeMessage, validateHudCard, type BridgeMessage } from '@mc/contracts';
import { createBridgeServer } from '../src/stub-bridge/server.js';
import { AGENDA_CARD, BRIEFING_CARDS, CLOSE_CARD, NUDGE_CARD, flashCardFor } from '../src/demo-cards.js';

let server: { port: number; close(): Promise<void> };
let ws: WebSocket;
const received: BridgeMessage[] = [];

function nextMessage(pred: (m: BridgeMessage) => boolean, timeoutMs = 3000): Promise<BridgeMessage> {
  return new Promise((resolve, reject) => {
    const found = received.find(pred);
    if (found) return resolve(found);
    const timer = setTimeout(() => reject(new Error('timeout waiting for message')), timeoutMs);
    const onMsg = (raw: WebSocket.RawData) => {
      const msg = JSON.parse(raw.toString()) as BridgeMessage;
      if (pred(msg)) { clearTimeout(timer); ws.off('message', onMsg); resolve(msg); }
    };
    ws.on('message', onMsg);
  });
}

beforeAll(async () => {
  server = await createBridgeServer({ port: 0 });
  ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);
  await new Promise<void>((res) => ws.on('open', () => res()));
  ws.on('message', (raw) => received.push(JSON.parse(raw.toString())));
  ws.send(JSON.stringify({ kind: 'hello', sessionId: 'test' }));
});

afterAll(async () => { ws.close(); await server.close(); });

describe('stub bridge', () => {
  it('acks hello', async () => {
    const ack = await nextMessage((m) => m.kind === 'hello_ack');
    expect(ack).toEqual({ kind: 'hello_ack', sessionId: 'test' });
  });

  it('pushes first card on /push and advances the deck on tap input', async () => {
    const res = await fetch(`http://127.0.0.1:${server.port}/push`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cards: [
        { type: 'briefing', seq: 1, line1: 'Card one' },
        { type: 'briefing', seq: 2, line1: 'Card two' },
      ] }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ queued: 1 });
    const first = await nextMessage((m) => m.kind === 'card' && m.card.seq === 1);
    expect(validateBridgeMessage(first)).toBe(true);
    ws.send(JSON.stringify({ kind: 'input', event: 'tap', source: 'sim' }));
    const second = await nextMessage((m) => m.kind === 'card' && m.card.seq === 2);
    expect(second.kind).toBe('card');
  });

  it('flashes on a must-fire transcript segment and not on a distractor', async () => {
    const fire = {
      sessionId: 'test', seq: 10, tStartMs: 0, tEndMs: 1000, speaker: 'visitor',
      text: 'We will deliver the readiness study by the end of July.', final: true,
    };
    const r1 = await fetch(`http://127.0.0.1:${server.port}/transcript`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(fire),
    });
    expect(await r1.json()).toMatchObject({ flash: true });
    await nextMessage((m) => m.kind === 'card' && m.card.type === 'commitment_flash');

    const distractor = { ...fire, seq: 19, text: 'No commitment yet on that front.' };
    const r2 = await fetch(`http://127.0.0.1:${server.port}/transcript`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(distractor),
    });
    expect(await r2.json()).toMatchObject({ flash: false });
  });

  it('rejects invalid payloads with 400', async () => {
    const res = await fetch(`http://127.0.0.1:${server.port}/transcript`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nope: true }),
    });
    expect(res.status).toBe(400);
  });

  it('pushes close card on /end', async () => {
    await fetch(`http://127.0.0.1:${server.port}/end`, { method: 'POST' });
    const close = await nextMessage((m) => m.kind === 'card' && m.card.type === 'close');
    expect(close.kind).toBe('card');
  });
});

describe('stub bridge resilience', () => {
  it('survives an abrupt client disconnect and keeps serving', async () => {
    const server2 = await createBridgeServer({ port: 0 });
    try {
      const ws2 = new WebSocket(`ws://127.0.0.1:${server2.port}/ws`);
      await new Promise<void>((res) => ws2.on('open', () => res()));
      ws2.terminate(); // abrupt, no close handshake
      await new Promise((r) => setTimeout(r, 100));
      const res = await fetch(`http://127.0.0.1:${server2.port}/health`);
      expect((await res.json())).toEqual({ ok: true });
    } finally {
      await server2.close();
    }
  });
});

describe('demo card schema validity', () => {
  it('every static demo card validates', () => {
    for (const card of [AGENDA_CARD, ...BRIEFING_CARDS, CLOSE_CARD, NUDGE_CARD]) {
      expect(validateHudCard(card), JSON.stringify(card)).toBe(true);
    }
  });

  it('flashCardFor output validates for the longest realistic commitment', () => {
    const card = flashCardFor({ who: 'Orion Systems', what: 'Commit 40 engineers to Example City pilot phase one', due: '2026-09', confidence: 0.95, verbatim: 'x', segmentSeq: 13 });
    expect(validateHudCard(card)).toBe(true);
  });
});
