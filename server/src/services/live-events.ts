import { EventEmitter } from "node:events";
import type { LiveEvent, LiveEventType } from "@paperclipai/shared";
import type { Db } from "@paperclipai/db";
import { executionEvents } from "@paperclipai/db";

type LiveEventPayload = Record<string, unknown>;
type LiveEventListener = (event: LiveEvent) => void;

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

let nextEventId = 0;

// Lazy DB handle for event persistence – set once at server startup
let _persistDb: Db | null = null;

export function setLiveEventDb(db: Db) {
  _persistDb = db;
}

/**
 * Fire-and-forget: persist a live event to the execution_events table.
 * Failures are silently swallowed so they never break the hot path.
 */
function persistEvent(event: LiveEvent) {
  if (!_persistDb) return;
  _persistDb
    .insert(executionEvents)
    .values({
      companyId: event.companyId,
      eventType: event.type,
      severity: "info",
      message: typeof event.payload === "object" && event.payload && "message" in event.payload
        ? String((event.payload as Record<string, unknown>).message)
        : null,
      payload: (event.payload ?? {}) as Record<string, unknown>,
      createdAt: new Date(event.createdAt),
    })
    .catch(() => {
      // Best-effort persistence – do not let DB errors affect live events
    });
}

function toLiveEvent(input: {
  companyId: string;
  type: LiveEventType;
  payload?: LiveEventPayload;
}): LiveEvent {
  nextEventId += 1;
  return {
    id: nextEventId,
    companyId: input.companyId,
    type: input.type,
    createdAt: new Date().toISOString(),
    payload: input.payload ?? {},
  };
}

export function publishLiveEvent(input: {
  companyId: string;
  type: LiveEventType;
  payload?: LiveEventPayload;
}) {
  const event = toLiveEvent(input);
  emitter.emit(input.companyId, event);
  persistEvent(event);
  return event;
}

export function subscribeCompanyLiveEvents(companyId: string, listener: LiveEventListener) {
  emitter.on(companyId, listener);
  return () => emitter.off(companyId, listener);
}
