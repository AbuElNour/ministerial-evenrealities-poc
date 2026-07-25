import type { HudCard } from '@mc/contracts';

const MAX = 40;
const clamp = (s: string): string => (s.length <= MAX ? s : s.slice(0, MAX - 1) + '…');

export function cardContent(card: HudCard): string {
  const l1 = clamp(card.line1);
  return card.line2 ? `${l1}\n${clamp(card.line2)}` : l1;
}
