import { createServer } from 'node:http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import {
  validateBridgeMessage, validateHudCard, validateTranscriptSegment,
  type BridgeMessage, type HudCard, type TranscriptSegment,
} from '@mc/contracts';
import { MockExtractor } from '../extractor.js';
import { mockSummary } from '../summarizer.js';
import { CLOSE_CARD, flashCardFor } from '../demo-cards.js';

export async function createBridgeServer(opts: { port?: number } = {}) {
  const app = express();
  app.use(express.json());

  const extractor = new MockExtractor();
  const clients = new Set<WebSocket>();
  const recentSegments: TranscriptSegment[] = [];
  let pendingCards: HudCard[] = [];

  function push(card: HudCard): void {
    if (!validateHudCard(card)) { console.error('refusing to push invalid HudCard:', card); return; }
    const msg: BridgeMessage = { kind: 'card', card };
    const raw = JSON.stringify(msg);
    for (const ws of clients) if (ws.readyState === WebSocket.OPEN) ws.send(raw);
  }

  function advanceDeck(): void {
    const next = pendingCards.shift();
    if (next) push(next);
  }

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.post('/push', (req, res) => {
    const cards: unknown[] = Array.isArray(req.body?.cards) ? req.body.cards : [];
    if (cards.length === 0 || !cards.every((c) => validateHudCard(c))) {
      return res.status(400).json({ error: 'cards[] required, each a valid HudCard' });
    }
    pendingCards = cards as HudCard[];
    advanceDeck();
    res.json({ queued: pendingCards.length });
  });

  app.post('/transcript', (req, res) => {
    if (!validateTranscriptSegment(req.body)) {
      return res.status(400).json({ error: 'invalid TranscriptSegment' });
    }
    const seg = req.body as TranscriptSegment;
    recentSegments.push(seg);
    if (recentSegments.length > 4) recentSegments.shift();
    push(mockSummary(recentSegments));
    const commitment = extractor.extract(seg);
    if (commitment) push(flashCardFor(commitment));
    res.json({ flash: commitment !== null });
  });

  app.post('/end', (_req, res) => {
    push(CLOSE_CARD);
    res.json({ ok: true });
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    ws.on('error', (err) => { console.warn('ws client error:', err.message); clients.delete(ws); });
    ws.on('message', (raw) => {
      let msg: unknown;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (!validateBridgeMessage(msg)) return; // log-and-drop
      const m = msg as BridgeMessage;
      if (m.kind === 'hello') ws.send(JSON.stringify({ kind: 'hello_ack', sessionId: m.sessionId }));
      if (m.kind === 'input' && m.event === 'tap') advanceDeck();
      if (m.kind === 'input' && m.event === 'double_tap') push(CLOSE_CARD);
    });
  });

  wss.on('error', (err) => console.warn('wss error:', err.message));

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(opts.port ?? 8787, () => {
      httpServer.removeListener('error', reject);
      resolve();
    });
  });
  httpServer.on('error', (err) => console.warn('http server error:', err.message));
  const address = httpServer.address();
  const port = typeof address === 'object' && address ? address.port : (opts.port ?? 8787);

  return {
    port,
    close: () => new Promise<void>((res, rej) => {
      for (const ws of clients) ws.terminate();
      wss.close();
      httpServer.close((err) => (err ? rej(err) : res()));
    }),
  };
}
