import { describe, it, expect } from 'vitest';
import { OsEventTypeList, EventSourceType } from '@evenrealities/even_hub_sdk';
import { mapEvent } from '../src/input-map.js';

describe('mapEvent', () => {
  it('maps sysEvent with UNDEFINED eventType to tap (protobuf zero-omission)', () => {
    expect(mapEvent({ sysEvent: { eventSource: EventSourceType.TOUCH_EVENT_FROM_RING } as never }))
      .toEqual({ event: 'tap', source: 'ring' });
  });
  it('maps DOUBLE_CLICK from glasses touchpad', () => {
    expect(mapEvent({ sysEvent: { eventType: OsEventTypeList.DOUBLE_CLICK_EVENT, eventSource: EventSourceType.TOUCH_EVENT_FROM_GLASSES_R } as never }))
      .toEqual({ event: 'double_tap', source: 'glasses' });
  });
  it('maps textEvent scrolls to swipes', () => {
    expect(mapEvent({ textEvent: { eventType: OsEventTypeList.SCROLL_TOP_EVENT } as never }))
      .toEqual({ event: 'swipe_up', source: 'unknown' });
  });
  it('returns null for lifecycle events and empty events', () => {
    expect(mapEvent({ sysEvent: { eventType: OsEventTypeList.FOREGROUND_EXIT_EVENT } as never })).toBeNull();
    expect(mapEvent({})).toBeNull();
  });
  it('textEvent with omitted eventType coalesces to tap (defensive for hardware zero-omission)', () => {
    expect(mapEvent({ textEvent: {} as never })).toEqual({ event: 'tap', source: 'unknown' });
  });
});
