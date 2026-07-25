# Stub bridge contract

This documents the wire surface the stub bridge implements, which a future MuleSoft
implementation must match exactly. Source of truth for all message shapes below is
`contracts/schemas/*.json` — this file is a human-readable index, not a spec.

## HTTP endpoints

- `GET /health` -> `200 {ok: true}`
- `POST /push {cards: HudCard[]}` -> `200 {queued: N}` where `N` is the number of cards
  REMAINING in the deck after the first card was auto-pushed to connected clients; `400`
  if `cards` is missing/empty or any card fails HudCard schema validation.
- `POST /transcript <TranscriptSegment>` -> `200 {flash: boolean}`; `400` if the body fails
  TranscriptSegment schema validation.
- `POST /end` -> `200 {ok: true}`, and also pushes the close card over WS.

## WS `/ws` semantics

- Client sends `{kind: 'hello', sessionId}` -> server replies `{kind: 'hello_ack', sessionId}`.
- Server pushes `{kind: 'card', card}` unsolicited as cards become available.
- Client input `{kind: 'input', event: 'tap', ...}` advances the queued deck (pushes next card).
- Client input `{kind: 'input', event: 'double_tap', ...}` pushes the close card.
- `swipe_up` / `swipe_down` are valid input events the plugin sends. The bridge MUST
  accept these without error; it currently ignores them (reserved for future use).
- Any WS message that fails BridgeMessage schema validation is silently dropped (no error
  sent to the client).
- Clients get a NEW socketId per reconnect and must re-send `hello`.

## Validation

All message shapes are defined by `contracts/schemas/*.json` (source of truth). Invalid
HTTP request bodies get `400`; invalid WS messages are dropped silently, never rejected.
