import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { agents } from "./agents.js";
import { agentRuns } from "./agent_runs.js";
import { runSteps } from "./run_steps.js";

export const auditEntries = pgTable(
  "audit_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    runId: uuid("run_id").references(() => agentRuns.id),
    stepId: uuid("step_id").references(() => runSteps.id),
    agentId: uuid("agent_id").references(() => agents.id),
    actorType: text("actor_type").notNull().default("system"),
    actorId: text("actor_id").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    beforeJson: jsonb("before_json").$type<Record<string, unknown>>(),
    afterJson: jsonb("after_json").$type<Record<string, unknown>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyCreatedIdx: index("audit_entries_company_created_idx").on(
      table.companyId,
      table.createdAt,
    ),
    runIdx: index("audit_entries_run_id_idx").on(table.runId),
    actionIdx: index("audit_entries_action_idx").on(table.action, table.createdAt),
    entityIdx: index("audit_entries_entity_idx").on(table.entityType, table.entityId),
  }),
);
