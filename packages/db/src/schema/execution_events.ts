import { pgTable, uuid, text, timestamp, jsonb, index, bigserial } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { agents } from "./agents.js";
import { agentRuns } from "./agent_runs.js";
import { runSteps } from "./run_steps.js";

export const executionEvents = pgTable(
  "execution_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    runId: uuid("run_id").references(() => agentRuns.id),
    stepId: uuid("step_id").references(() => runSteps.id),
    agentId: uuid("agent_id").references(() => agents.id),
    eventType: text("event_type").notNull(),
    severity: text("severity").notNull().default("info"),
    message: text("message"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    correlationId: uuid("correlation_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyRunIdx: index("execution_events_company_run_idx").on(table.companyId, table.runId),
    runStepIdx: index("execution_events_run_step_idx").on(table.runId, table.stepId),
    eventTypeIdx: index("execution_events_event_type_idx").on(table.eventType, table.createdAt),
    correlationIdx: index("execution_events_correlation_idx").on(table.correlationId),
  }),
);
