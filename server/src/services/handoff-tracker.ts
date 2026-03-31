import { and, eq, or, desc } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { handoffRecords, agents } from "@paperclipai/db";
import { notFound, unprocessable } from "../errors.js";
import { publishLiveEvent } from "./live-events.js";

export function handoffTrackerService(db: Db) {
  async function getHandoff(id: string) {
    const row = await db
      .select()
      .from(handoffRecords)
      .where(eq(handoffRecords.id, id))
      .then((rows) => rows[0] ?? null);
    if (!row) throw notFound("Handoff not found");
    return row;
  }

  async function resolveCompanyId(agentId: string): Promise<string> {
    const agent = await db
      .select({ companyId: agents.companyId })
      .from(agents)
      .where(eq(agents.id, agentId))
      .then((rows) => rows[0] ?? null);
    if (!agent) throw notFound("Agent not found");
    return agent.companyId;
  }

  function emitHandoffEvent(
    companyId: string,
    handoff: typeof handoffRecords.$inferSelect,
    action: string,
  ) {
    publishLiveEvent({
      companyId,
      type: "activity.logged",
      payload: {
        entity: "handoff",
        entityId: handoff.id,
        action,
        sourceAgentId: handoff.sourceAgentId,
        targetAgentId: handoff.targetAgentId,
        status: handoff.status,
      },
    });
  }

  return {
    createHandoff: async (
      fromAgentId: string,
      toAgentId: string,
      sourceRunId: string,
      context?: Record<string, unknown>,
    ) => {
      const companyId = await resolveCompanyId(fromAgentId);
      const handoff = await db
        .insert(handoffRecords)
        .values({
          companyId,
          sourceAgentId: fromAgentId,
          targetAgentId: toAgentId,
          sourceRunId,
          status: "pending",
          contextJson: context ?? {},
        })
        .returning()
        .then((rows) => rows[0]);
      emitHandoffEvent(companyId, handoff, "handoff.created");
      return handoff;
    },

    acceptHandoff: async (id: string) => {
      const existing = await getHandoff(id);
      if (existing.status !== "pending") {
        throw unprocessable("Only pending handoffs can be accepted");
      }
      const now = new Date();
      const updated = await db
        .update(handoffRecords)
        .set({ status: "accepted", acceptedAt: now, updatedAt: now })
        .where(and(eq(handoffRecords.id, id), eq(handoffRecords.status, "pending")))
        .returning()
        .then((rows) => rows[0]);
      if (updated) emitHandoffEvent(existing.companyId, updated, "handoff.accepted");
      return updated ?? existing;
    },

    completeHandoff: async (id: string, result?: Record<string, unknown>) => {
      const existing = await getHandoff(id);
      if (existing.status !== "accepted") {
        throw unprocessable("Only accepted handoffs can be completed");
      }
      const now = new Date();
      const updated = await db
        .update(handoffRecords)
        .set({
          status: "completed",
          completedAt: now,
          updatedAt: now,
          resultJson: result ?? existing.resultJson,
        })
        .where(and(eq(handoffRecords.id, id), eq(handoffRecords.status, "accepted")))
        .returning()
        .then((rows) => rows[0]);
      if (updated) emitHandoffEvent(existing.companyId, updated, "handoff.completed");
      return updated ?? existing;
    },

    timeoutHandoff: async (id: string) => {
      const existing = await getHandoff(id);
      if (existing.status !== "pending" && existing.status !== "accepted") {
        throw unprocessable("Only pending or accepted handoffs can be timed out");
      }
      const now = new Date();
      const updated = await db
        .update(handoffRecords)
        .set({ status: "timed_out", updatedAt: now })
        .where(eq(handoffRecords.id, id))
        .returning()
        .then((rows) => rows[0]);
      if (updated) emitHandoffEvent(existing.companyId, updated, "handoff.timed_out");
      return updated ?? existing;
    },

    rejectHandoff: async (id: string, reason?: string) => {
      const existing = await getHandoff(id);
      if (existing.status !== "pending") {
        throw unprocessable("Only pending handoffs can be rejected");
      }
      const now = new Date();
      const updated = await db
        .update(handoffRecords)
        .set({ status: "rejected", reason: reason ?? null, updatedAt: now })
        .where(and(eq(handoffRecords.id, id), eq(handoffRecords.status, "pending")))
        .returning()
        .then((rows) => rows[0]);
      if (updated) emitHandoffEvent(existing.companyId, updated, "handoff.rejected");
      return updated ?? existing;
    },

    getById: (id: string) => getHandoff(id),

    getPendingHandoffs: (companyId: string) =>
      db
        .select()
        .from(handoffRecords)
        .where(and(eq(handoffRecords.companyId, companyId), eq(handoffRecords.status, "pending")))
        .orderBy(desc(handoffRecords.createdAt)),

    getHandoffsByAgent: (agentId: string) =>
      db
        .select()
        .from(handoffRecords)
        .where(
          or(
            eq(handoffRecords.sourceAgentId, agentId),
            eq(handoffRecords.targetAgentId, agentId),
          ),
        )
        .orderBy(desc(handoffRecords.createdAt)),

    listByCompany: (companyId: string, status?: string) => {
      const conditions = [eq(handoffRecords.companyId, companyId)];
      if (status) conditions.push(eq(handoffRecords.status, status));
      return db
        .select()
        .from(handoffRecords)
        .where(and(...conditions))
        .orderBy(desc(handoffRecords.createdAt));
    },
  };
}
