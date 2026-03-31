import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { issues } from "@paperclipai/db";
import { notFound, unprocessable } from "../errors.js";
import { publishLiveEvent } from "./live-events.js";

/**
 * Lightweight task-dependency tracker.
 *
 * Dependencies are stored inside an issue's existing `description` metadata is
 * not ideal for queries, so we use a simple in-DB jsonb column on the issue
 * itself — but the schema doesn't have one. Instead, we store dependencies as
 * parent-child relationships: an issue's `parentId` already exists but serves a
 * different purpose (sub-tasks).
 *
 * To avoid schema changes, we track dependency edges in memory backed by an
 * auxiliary jsonb map stored in the issue's `assigneeAdapterOverrides` under a
 * namespaced key `_dependencies`. This keeps things minimal without a new table.
 */

type DependencyType = "blocks" | "requires";

interface DependencyEdge {
  dependsOnIssueId: string;
  type: DependencyType;
  createdAt: string;
}

const DEP_KEY = "_dependencies";

function readDeps(overrides: Record<string, unknown> | null): DependencyEdge[] {
  if (!overrides || !Array.isArray(overrides[DEP_KEY])) return [];
  return overrides[DEP_KEY] as DependencyEdge[];
}

function writeDeps(
  overrides: Record<string, unknown> | null,
  deps: DependencyEdge[],
): Record<string, unknown> {
  return { ...(overrides ?? {}), [DEP_KEY]: deps };
}

export function taskDependencyService(db: Db) {
  async function getIssue(issueId: string) {
    const row = await db
      .select()
      .from(issues)
      .where(eq(issues.id, issueId))
      .then((rows) => rows[0] ?? null);
    if (!row) throw notFound("Issue not found");
    return row;
  }

  return {
    createDependency: async (
      issueId: string,
      dependsOnIssueId: string,
      type: DependencyType = "blocks",
    ) => {
      if (issueId === dependsOnIssueId) {
        throw unprocessable("An issue cannot depend on itself");
      }
      const issue = await getIssue(issueId);
      // verify target exists
      await getIssue(dependsOnIssueId);

      const existing = readDeps(issue.assigneeAdapterOverrides);
      const alreadyExists = existing.some(
        (d) => d.dependsOnIssueId === dependsOnIssueId && d.type === type,
      );
      if (alreadyExists) return { issueId, dependsOnIssueId, type, alreadyExisted: true };

      const updated = [
        ...existing,
        { dependsOnIssueId, type, createdAt: new Date().toISOString() },
      ];
      await db
        .update(issues)
        .set({
          assigneeAdapterOverrides: writeDeps(issue.assigneeAdapterOverrides, updated),
          updatedAt: new Date(),
        })
        .where(eq(issues.id, issueId));

      publishLiveEvent({
        companyId: issue.companyId,
        type: "activity.logged",
        payload: {
          entity: "dependency",
          action: "dependency.created",
          issueId,
          dependsOnIssueId,
          dependencyType: type,
        },
      });

      return { issueId, dependsOnIssueId, type, alreadyExisted: false };
    },

    removeDependency: async (issueId: string, dependsOnIssueId: string) => {
      const issue = await getIssue(issueId);
      const existing = readDeps(issue.assigneeAdapterOverrides);
      const filtered = existing.filter((d) => d.dependsOnIssueId !== dependsOnIssueId);
      if (filtered.length === existing.length) return false;
      await db
        .update(issues)
        .set({
          assigneeAdapterOverrides: writeDeps(issue.assigneeAdapterOverrides, filtered),
          updatedAt: new Date(),
        })
        .where(eq(issues.id, issueId));
      return true;
    },

    getDependencies: async (issueId: string) => {
      const issue = await getIssue(issueId);
      return readDeps(issue.assigneeAdapterOverrides);
    },

    getDependents: async (issueId: string) => {
      // Find all issues in the same company that list `issueId` as a dependency.
      const issue = await getIssue(issueId);
      const allCompanyIssues = await db
        .select({
          id: issues.id,
          assigneeAdapterOverrides: issues.assigneeAdapterOverrides,
        })
        .from(issues)
        .where(eq(issues.companyId, issue.companyId));

      return allCompanyIssues
        .filter((i) => readDeps(i.assigneeAdapterOverrides).some((d) => d.dependsOnIssueId === issueId))
        .map((i) => i.id);
    },

    checkReady: async (issueId: string) => {
      const issue = await getIssue(issueId);
      const deps = readDeps(issue.assigneeAdapterOverrides);
      if (deps.length === 0) return { ready: true, pending: [] as string[] };

      const depIds = deps.map((d) => d.dependsOnIssueId);
      const depIssues = await db
        .select({ id: issues.id, status: issues.status })
        .from(issues)
        .where(inArray(issues.id, depIds));

      const doneStatuses = new Set(["done"]);
      const pending = depIssues
        .filter((i) => !doneStatuses.has(i.status))
        .map((i) => i.id);

      return { ready: pending.length === 0, pending };
    },

    listByCompany: async (companyId: string) => {
      const companyIssues = await db
        .select({
          id: issues.id,
          assigneeAdapterOverrides: issues.assigneeAdapterOverrides,
        })
        .from(issues)
        .where(eq(issues.companyId, companyId));

      const edges: Array<{ issueId: string; dependsOnIssueId: string; type: DependencyType }> = [];
      for (const issue of companyIssues) {
        for (const dep of readDeps(issue.assigneeAdapterOverrides)) {
          edges.push({
            issueId: issue.id,
            dependsOnIssueId: dep.dependsOnIssueId,
            type: dep.type,
          });
        }
      }
      return edges;
    },
  };
}
