import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BridgeClient } from '../src/bridge-client.js';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static OPEN = 1;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) { FakeWebSocket.instances.push(this); }
  send(_: string): void {}
  close(): void { this.onclose?.(); }
}

describe('BridgeClient reconnect cancellation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('close() during the reconnect window cancels the pending reconnect', () => {
    const client = new BridgeClient('ws://test/ws', 'demo', () => {});
    client.connect();
    expect(FakeWebSocket.instances).toHaveLength(1);
    FakeWebSocket.instances[0].onclose?.();   // schedules reconnect in 2s
    client.close();                            // must cancel it
    vi.advanceTimersByTime(5000);
    expect(FakeWebSocket.instances).toHaveLength(1); // no new socket
  });

  it('reconnects after 2s when not closed', () => {
    const client = new BridgeClient('ws://test/ws', 'demo', () => {});
    client.connect();
    FakeWebSocket.instances[0].onclose?.();
    vi.advanceTimersByTime(2000);
    expect(FakeWebSocket.instances).toHaveLength(2);
    client.close();
  });
});
