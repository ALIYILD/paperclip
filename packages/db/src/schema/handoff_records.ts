import { pgTable, uuid, text, timestamp, jsonb, index, integer } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { agents } from "./agents.js";
import { agentRuns } from "./agent_runs.js";
import { runSteps } from "./run_steps.js";

export const handoffRecords = pgTable(
  "handoff_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    sourceRunId: uuid("source_run_id").notNull().references(() => agentRuns.id),
    sourceStepId: uuid("source_step_id").references(() => runSteps.id),
    sourceAgentId: uuid("source_agent_id").notNull().references(() => agents.id),
    targetAgentId: uuid("target_agent_id").notNull().references(() => agents.id),
    targetRunId: uuid("target_run_id").references(() => agentRuns.id),
    status: text("status").notNull().default("pending"),
    reason: text("reason"),
    contextJson: jsonb("context_json").$type<Record<string, unknown>>(),
    resultJson: jsonb("result_json").$type<Record<string, unknown>>(),
    depth: integer("depth").notNull().default(0),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("handoff_records_company_status_idx").on(
      table.companyId,
      table.status,
    ),
    sourceRunIdx: index("handoff_records_source_run_idx").on(table.sourceRunId),
    targetRunIdx: index("handoff_records_target_run_idx").on(table.targetRunId),
    sourceAgentIdx: index("handoff_records_source_agent_idx").on(table.sourceAgentId),
    targetAgentIdx: index("handoff_records_target_agent_idx").on(table.targetAgentId),
  }),
);
