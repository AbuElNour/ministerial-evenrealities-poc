import type { HudCard } from '@mc/contracts';
import { parseBridgeMessage, inputMessage, helloMessage } from './protocol.js';
import type { PluginInput } from './input-map.js';

const RECONNECT_MS = 2000;

export class BridgeClient {
  private ws: WebSocket | null = null;
  private closed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly url: string,
    private readonly sessionId: string,
    private readonly onCard: (card: HudCard) => void,
    private readonly onStatus: (s: string) => void = () => {},
  ) {}

  connect(): void {
    this.onStatus(`connecting ${this.url}…`);
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.onStatus('bridge connected');
      this.ws?.send(helloMessage(this.sessionId)); // re-announce on every (re)connect
    };
    this.ws.onmessage = (ev) => {
      const msg = parseBridgeMessage(String(ev.data));
      if (msg?.kind === 'card') this.onCard(msg.card);
    };
    this.ws.onclose = () => {
      this.onStatus('bridge disconnected — retrying');
      if (!this.closed) this.reconnectTimer = setTimeout(() => { if (!this.closed) this.connect(); }, RECONNECT_MS);
    };
    this.ws.onerror = () => this.ws?.close();
  }

  sendInput(input: PluginInput): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(inputMessage(input.event, input.source));
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer !== undefined) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}
