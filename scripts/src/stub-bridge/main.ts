import { createBridgeServer } from './server.js';

const port = Number(process.env.BRIDGE_PORT ?? 8787);
try {
  const server = await createBridgeServer({ port });
  console.log(`stub-bridge listening on http://localhost:${server.port} (ws: /ws)`);
} catch (err) {
  console.error('stub-bridge failed to start:', err);
  process.exit(1);
}
