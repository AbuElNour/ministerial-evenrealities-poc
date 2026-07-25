import type { MinutesDocument, SlackMinutesPayload } from '@mc/contracts';

export function buildSlackMinutesPayload(
  minutes: MinutesDocument,
  opts: { channelId: string; taskBaseUrl: string },
): SlackMinutesPayload {
  const actions = minutes.actionItems;
  const canvasMarkdown = [
    `# ${minutes.title}`,
    '',
    `**Attendees:** ${minutes.attendees.join(', ')}`,
    '',
    '## Summary',
    minutes.summaryEn,
    '',
    '## Key points',
    ...minutes.keyPoints.map((k) => `- ${k}`),
    '',
    '## Decisions',
    ...minutes.decisions.map((d) => `- ${d}`),
    '',
    '## Action items',
    ...actions.map((a) => `- [ ] **${a.owner}** — ${a.what} (due ${a.due})`),
    '',
    '## ملخص',
    minutes.summaryAr,
  ].join('\n');

  return {
    channelId: opts.channelId,
    message: `Minutes posted: ${minutes.title} — ${actions.length} action item(s) logged.`,
    canvasTitle: `Minutes — ${minutes.title}`,
    canvasMarkdown,
    taskLinks: actions.map((a, i) => ({
      title: `${a.owner}: ${a.what}`,
      url: `${opts.taskBaseUrl}/${i + 1}`,
    })),
  };
}
