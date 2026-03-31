import { pgTable, uuid, text, timestamp, jsonb, index, integer, real } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { agents } from "./agents.js";
import { agentRuns } from "./agent_runs.js";

export const runSteps = pgTable(
  "run_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id").notNull().references(() => agentRuns.id),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    agentId: uuid("agent_id").notNull().references(() => agents.id),
    seq: integer("seq").notNull(),
    type: text("type").notNull(),
    status: text("status").notNull().default("pending"),
    name: text("name"),
    inputJson: jsonb("input_json").$type<Record<string, unknown>>(),
    outputJson: jsonb("output_json").$type<Record<string, unknown>>(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costCents: real("cost_cents").notNull().default(0),
    toolInvocationId: uuid("tool_invocation_id"),
    approvalRequestId: uuid("approval_request_id"),
    handoffRecordId: uuid("handoff_record_id"),
    error: text("error"),
    durationMs: integer("duration_ms"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    runSeqIdx: index("run_steps_run_seq_idx").on(table.runId, table.seq),
    companyRunIdx: index("run_steps_company_run_idx").on(table.companyId, table.runId),
  }),
);
