import { validateBridgeMessage, type BridgeMessage, type InputEventName, type InputSource } from '@mc/contracts';

export function parseBridgeMessage(raw: string): BridgeMessage | null {
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return null; }
  if (!validateBridgeMessage(data)) {
    console.warn('dropped invalid bridge message', data);
    return null;
  }
  return data as BridgeMessage;
}

export function inputMessage(event: InputEventName, source: InputSource): string {
  return JSON.stringify({ kind: 'input', event, source } satisfies BridgeMessage);
}

export function helloMessage(sessionId: string): string {
  return JSON.stringify({ kind: 'hello', sessionId } satisfies BridgeMessage);
}
