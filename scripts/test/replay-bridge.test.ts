import { describe, it, expect } from 'vitest';
import { createBridgeServer } from '../src/stub-bridge/server.js';
import { replayThroughBridge } from '../src/replay.js';

describe('replayThroughBridge', () => {
  it('streams the whole fixture and reports 3 flashes', async () => {
    const server = await createBridgeServer({ port: 0 });
    try {
      const { flashes } = await replayThroughBridge(`http://127.0.0.1:${server.port}`);
      expect(flashes).toBe(3);
    } finally {
      await server.close();
    }
  }, 15000);
});
