import { pgTable, uuid, text, timestamp, jsonb, index, integer, real } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { agents } from "./agents.js";
import { heartbeatRuns } from "./heartbeat_runs.js";
import { issues } from "./issues.js";
import type { ExecutionPolicy, RetryPolicy } from "@paperclipai/shared";

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    agentId: uuid("agent_id").notNull().references(() => agents.id),
    heartbeatRunId: uuid("heartbeat_run_id").references(() => heartbeatRuns.id),
    issueId: uuid("issue_id").references(() => issues.id),
    parentRunId: uuid("parent_run_id"), // self-ref; FK added via migration
    status: text("status").notNull().default("queued"),
    invocationSource: text("invocation_source").notNull().default("on_demand"),
    triggerDetail: text("trigger_detail"),
    prompt: text("prompt"),
    model: text("model"),
    executionPolicyJson: jsonb("execution_policy_json").$type<ExecutionPolicy>(),
    retryPolicyJson: jsonb("retry_policy_json").$type<RetryPolicy>(),
    attemptNumber: integer("attempt_number").notNull().default(0),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cachedInputTokens: integer("cached_input_tokens").notNull().default(0),
    costCents: real("cost_cents").notNull().default(0),
    stepCount: integer("step_count").notNull().default(0),
    toolCallCount: integer("tool_call_count").notNull().default(0),
    sessionSnapshot: jsonb("session_snapshot").$type<Record<string, unknown>>(),
    error: text("error"),
    errorCode: text("error_code"),
    resultJson: jsonb("result_json").$type<Record<string, unknown>>(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyAgentStatusIdx: index("agent_runs_company_agent_status_idx").on(
      table.companyId,
      table.agentId,
      table.status,
    ),
    heartbeatRunIdx: index("agent_runs_heartbeat_run_id_idx").on(table.heartbeatRunId),
    issueIdx: index("agent_runs_issue_id_idx").on(table.issueId),
    parentRunIdx: index("agent_runs_parent_run_id_idx").on(table.parentRunId),
    companyCreatedIdx: index("agent_runs_company_created_idx").on(
      table.companyId,
      table.createdAt,
    ),
  }),
);
