import {
  waitForEvenAppBridge, CreateStartUpPageContainer, TextContainerProperty, TextContainerUpgrade,
  StartUpPageCreateResult, type EvenAppBridge, type EvenHubEvent,
} from '@evenrealities/even_hub_sdk';
import type { HudCard } from '@mc/contracts';
import { cardContent } from './format-card.js';
import { mapEvent, type PluginInput } from './input-map.js';

const CALL_TIMEOUT_MS = 5000;
const FLASH_MS = 4000;

export class GlassesDisplay {
  private bridge!: EvenAppBridge;
  private queue: Promise<unknown> = Promise.resolve();
  private flashTimer: ReturnType<typeof setTimeout> | undefined;

  async init(onInput: (input: PluginInput) => void): Promise<void> {
    this.bridge = await waitForEvenAppBridge();
    const result = await this.bridge.createStartUpPageContainer(new CreateStartUpPageContainer({
      containerTotalNum: 2,
      textObject: [
        new TextContainerProperty({
          containerID: 1, containerName: 'main', isEventCapture: 1,
          xPosition: 16, yPosition: 40, width: 544, height: 120, content: 'Executive HUD ready',
        }),
        new TextContainerProperty({
          containerID: 2, containerName: 'flash', isEventCapture: 0,
          xPosition: 16, yPosition: 180, width: 544, height: 80, content: ' ',
        }),
      ],
    }));
    if (result !== StartUpPageCreateResult.success) {
      throw new Error(`createStartUpPageContainer failed: ${StartUpPageCreateResult[result]}`);
    }
    this.bridge.onEvenHubEvent((event: EvenHubEvent) => {
      const input = mapEvent(event);
      if (input) onInput(input);
    });
  }

  showCard(card: HudCard): void {
    this.upgradeText(1, 'main', cardContent(card));
  }

  flash(card: HudCard, ms: number = FLASH_MS): void {
    if (this.flashTimer !== undefined) clearTimeout(this.flashTimer);
    this.upgradeText(2, 'flash', cardContent(card));
    this.flashTimer = setTimeout(() => this.upgradeText(2, 'flash', ' '), ms);
  }

  // All BLE-bound calls are serialized and time-boxed: a flaky hop can hang a
  // bridge call for ~30s, and concurrent writes can wedge the render queue.
  private upgradeText(containerID: number, containerName: string, content: string): void {
    // Known limitation: a timed-out SDK call is not cancelled and its late write may land
    // after a newer one (no abort API). Flash clear timer also starts at enqueue, not
    // render — acceptable at demo pacing.
    this.queue = this.queue
      .then(() => Promise.race([
        this.bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID, containerName, content })),
        new Promise((_res, rej) => setTimeout(() => rej(new Error('bridge call timeout')), CALL_TIMEOUT_MS)),
      ]))
      .catch((err) => console.warn(`textContainerUpgrade(${containerName}) failed:`, err));
  }
}
