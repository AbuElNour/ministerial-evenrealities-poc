import { describe, it, expect } from 'vitest';
import { parseBridgeMessage, inputMessage } from '../src/protocol.js';

describe('protocol', () => {
  it('parses a valid card message', () => {
    const msg = parseBridgeMessage(JSON.stringify({ kind: 'card', card: { type: 'agenda', seq: 0, line1: 'Hi' } }));
    expect(msg?.kind).toBe('card');
  });
  it('drops invalid JSON and invalid messages', () => {
    expect(parseBridgeMessage('not json')).toBeNull();
    expect(parseBridgeMessage(JSON.stringify({ kind: 'card', card: { type: 'popup' } }))).toBeNull();
  });
  it('serializes a valid input message', () => {
    expect(JSON.parse(inputMessage('tap', 'ring'))).toEqual({ kind: 'input', event: 'tap', source: 'ring' });
  });
});
