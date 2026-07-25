import { OsEventTypeList, EventSourceType, type EvenHubEvent } from '@evenrealities/even_hub_sdk';
import type { InputEventName, InputSource } from '@mc/contracts';

export interface PluginInput { event: InputEventName; source: InputSource }

function sourceOf(raw: EventSourceType | undefined): InputSource {
  if (raw === EventSourceType.TOUCH_EVENT_FROM_RING) return 'ring';
  if (raw === EventSourceType.TOUCH_EVENT_FROM_GLASSES_R || raw === EventSourceType.TOUCH_EVENT_FROM_GLASSES_L) return 'glasses';
  return 'unknown';
}

export function mapEvent(e: EvenHubEvent): PluginInput | null {
  const holder = e.sysEvent ?? e.textEvent;
  if (!holder) return null;
  // Protobuf zero-omission: CLICK_EVENT (=0) arrives as undefined. Coalesce.
  const type = holder.eventType ?? OsEventTypeList.CLICK_EVENT;
  const source = sourceOf(e.sysEvent?.eventSource);
  switch (type) {
    case OsEventTypeList.CLICK_EVENT: return { event: 'tap', source };
    case OsEventTypeList.DOUBLE_CLICK_EVENT: return { event: 'double_tap', source };
    case OsEventTypeList.SCROLL_TOP_EVENT: return { event: 'swipe_up', source };
    case OsEventTypeList.SCROLL_BOTTOM_EVENT: return { event: 'swipe_down', source };
    default: return null; // lifecycle events handled elsewhere
  }
}
