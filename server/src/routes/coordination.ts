import { Router } from "express";
import type { Db } from "@paperclipai/db";
import { handoffTrackerService } from "../services/handoff-tracker.js";
import { taskDependencyService } from "../services/task-dependencies.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { logActivity } from "../services/activity-log.js";
import { badRequest } from "../errors.js";

export function coordinationRoutes(db: Db) {
  const router = Router();
  const handoffs = handoffTrackerService(db);
  const deps = taskDependencyService(db);

  // --- Handoff routes ---

  router.get("/companies/:companyId/handoffs", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const status = req.query.status as string | undefined;
    const agentId = req.query.agentId as string | undefined;

    if (agentId) {
      const result = await handoffs.getHandoffsByAgent(agentId);
      res.json(result);
      return;
    }
    const result = await handoffs.listByCompany(companyId, status);
    res.json(result);
  });

  router.post("/companies/:companyId/handoffs", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { fromAgentId, toAgentId, sourceRunId, context } = req.body;
    if (!fromAgentId || !toAgentId || !sourceRunId) {
      throw badRequest("fromAgentId, toAgentId, and sourceRunId are required");
    }
    const handoff = await handoffs.createHandoff(fromAgentId, toAgentId, sourceRunId, context);
    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "handoff.created",
      entityType: "handoff",
      entityId: handoff.id,
      details: { fromAgentId, toAgentId, sourceRunId },
    });
    res.status(201).json(handoff);
  });

  router.patch("/handoffs/:id/accept", async (req, res) => {
    const id = req.params.id as string;
    const handoff = await handoffs.acceptHandoff(id);
    res.json(handoff);
  });

  router.patch("/handoffs/:id/complete", async (req, res) => {
    const id = req.params.id as string;
    const result = req.body.result as Record<string, unknown> | undefined;
    const handoff = await handoffs.completeHandoff(id, result);
    res.json(handoff);
  });

  router.patch("/handoffs/:id/reject", async (req, res) => {
    const id = req.params.id as string;
    const reason = req.body.reason as string | undefined;
    const handoff = await handoffs.rejectHandoff(id, reason);
    res.json(handoff);
  });

  router.patch("/handoffs/:id/timeout", async (req, res) => {
    const id = req.params.id as string;
    const handoff = await handoffs.timeoutHandoff(id);
    res.json(handoff);
  });

  // --- Dependency routes ---

  router.get("/companies/:companyId/dependencies", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const result = await deps.listByCompany(companyId);
    res.json(result);
  });

  router.post("/companies/:companyId/dependencies", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { issueId, dependsOnIssueId, type } = req.body;
    if (!issueId || !dependsOnIssueId) {
      throw badRequest("issueId and dependsOnIssueId are required");
    }
    const result = await deps.createDependency(issueId, dependsOnIssueId, type ?? "blocks");
    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "dependency.created",
      entityType: "issue",
      entityId: issueId,
      details: { dependsOnIssueId, type: type ?? "blocks" },
    });
    res.status(201).json(result);
  });

  router.get("/issues/:issueId/ready", async (req, res) => {
    const issueId = req.params.issueId as string;
    const result = await deps.checkReady(issueId);
    res.json(result);
  });

  router.get("/issues/:issueId/dependencies", async (req, res) => {
    const issueId = req.params.issueId as string;
    const result = await deps.getDependencies(issueId);
    res.json(result);
  });

  router.get("/issues/:issueId/dependents", async (req, res) => {
    const issueId = req.params.issueId as string;
    const result = await deps.getDependents(issueId);
    res.json(result);
  });

  router.delete("/issues/:issueId/dependencies/:depIssueId", async (req, res) => {
    const { issueId, depIssueId } = req.params;
    const removed = await deps.removeDependency(issueId, depIssueId);
    res.json({ removed });
  });

  return router;
}
