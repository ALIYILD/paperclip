import { Router } from "express";
import { and, eq, gte, sql, desc } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { heartbeatRuns, agents, executionEvents } from "@paperclipai/db";
import { assertCompanyAccess } from "./authz.js";

export function observabilityRoutes(db: Db) {
  const router = Router();

  // GET /companies/:companyId/observability/run-stats
  // Returns counts of runs by status in last 24h
  router.get("/companies/:companyId/observability/run-stats", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await db
      .select({
        status: heartbeatRuns.status,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(heartbeatRuns)
      .where(
        and(
          eq(heartbeatRuns.companyId, companyId),
          gte(heartbeatRuns.createdAt, since),
        ),
      )
      .groupBy(heartbeatRuns.status);

    const stats: Record<string, number> = {};
    for (const row of rows) {
      stats[row.status] = Number(row.count);
    }

    res.json({ since: since.toISOString(), stats });
  });

  // GET /companies/:companyId/observability/agent-health
  // Returns per-agent: last run time, success rate, current status
  router.get("/companies/:companyId/observability/agent-health", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);

    const companyAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
        status: agents.status,
      })
      .from(agents)
      .where(eq(agents.companyId, companyId));

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const health = [];

    for (const agent of companyAgents) {
      const runStats = await db
        .select({
          total: sql<number>`count(*)`.as("total"),
          succeeded: sql<number>`count(*) filter (where ${heartbeatRuns.status} = 'succeeded')`.as("succeeded"),
          lastFinished: sql<string | null>`max(${heartbeatRuns.finishedAt})`.as("lastFinished"),
        })
        .from(heartbeatRuns)
        .where(
          and(
            eq(heartbeatRuns.agentId, agent.id),
            gte(heartbeatRuns.createdAt, since),
          ),
        );

      const row = runStats[0];
      const total = Number(row?.total ?? 0);
      const succeeded = Number(row?.succeeded ?? 0);

      health.push({
        agentId: agent.id,
        agentName: agent.name,
        currentStatus: agent.status,
        lastRunTime: row?.lastFinished ?? null,
        runsLast24h: total,
        successRate: total > 0 ? Math.round((succeeded / total) * 10000) / 100 : null,
      });
    }

    res.json({ agents: health });
  });

  // GET /companies/:companyId/observability/events
  // Returns last 100 persisted events from execution_events table
  router.get("/companies/:companyId/observability/events", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);

    const rows = await db
      .select()
      .from(executionEvents)
      .where(eq(executionEvents.companyId, companyId))
      .orderBy(desc(executionEvents.createdAt))
      .limit(100);

    res.json({ events: rows });
  });

  return router;
}
