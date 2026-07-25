import type { HudCard } from '@mc/contracts';
import { GlassesDisplay } from './glasses.js';
import { BridgeClient } from './bridge-client.js';
import { cardContent } from './format-card.js';

const mirror = document.getElementById('mirror')!;
const status = document.getElementById('status')!;
const setStatus = (s: string) => { status.textContent = s; };

const params = new URLSearchParams(location.search);
const bridgeUrl = params.get('bridge') ?? 'ws://localhost:8787/ws';

async function boot(): Promise<void> {
  const display = new GlassesDisplay();

  const client = new BridgeClient(bridgeUrl, 'demo', (card: HudCard) => {
    if (card.type === 'commitment_flash') display.flash(card);
    else display.showCard(card);
    mirror.textContent = cardContent(card) + (card.type === 'commitment_flash' ? '  ⚡' : '');
  }, setStatus);

  await display.init((input) => {
    setStatus(`input: ${input.event} (${input.source})`);
    client.sendInput(input);
  });

  client.connect();
}

boot().catch((err) => setStatus(`boot error: ${err}`));
