CREATE TABLE IF NOT EXISTS "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"heartbeat_run_id" uuid,
	"issue_id" uuid,
	"parent_run_id" uuid,
	"status" text DEFAULT 'queued' NOT NULL,
	"invocation_source" text DEFAULT 'on_demand' NOT NULL,
	"trigger_detail" text,
	"prompt" text,
	"model" text,
	"execution_policy_json" jsonb,
	"retry_policy_json" jsonb,
	"attempt_number" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cached_input_tokens" integer DEFAULT 0 NOT NULL,
	"cost_cents" real DEFAULT 0 NOT NULL,
	"step_count" integer DEFAULT 0 NOT NULL,
	"tool_call_count" integer DEFAULT 0 NOT NULL,
	"session_snapshot" jsonb,
	"error" text,
	"error_code" text,
	"result_json" jsonb,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "run_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"name" text,
	"input_json" jsonb,
	"output_json" jsonb,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_cents" real DEFAULT 0 NOT NULL,
	"tool_invocation_id" uuid,
	"approval_request_id" uuid,
	"handoff_record_id" uuid,
	"error" text,
	"duration_ms" integer,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "execution_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"run_id" uuid,
	"step_id" uuid,
	"agent_id" uuid,
	"event_type" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"message" text,
	"payload" jsonb,
	"correlation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"run_id" uuid,
	"step_id" uuid,
	"agent_id" uuid,
	"actor_type" text DEFAULT 'system' NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"before_json" jsonb,
	"after_json" jsonb,
	"metadata" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "handoff_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"source_run_id" uuid NOT NULL,
	"source_step_id" uuid,
	"source_agent_id" uuid NOT NULL,
	"target_agent_id" uuid NOT NULL,
	"target_run_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"context_json" jsonb,
	"result_json" jsonb,
	"depth" integer DEFAULT 0 NOT NULL,
	"accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_heartbeat_run_id_heartbeat_runs_id_fk" FOREIGN KEY ("heartbeat_run_id") REFERENCES "public"."heartbeat_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "run_steps" ADD CONSTRAINT "run_steps_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "run_steps" ADD CONSTRAINT "run_steps_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "run_steps" ADD CONSTRAINT "run_steps_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_events" ADD CONSTRAINT "execution_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_events" ADD CONSTRAINT "execution_events_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_events" ADD CONSTRAINT "execution_events_step_id_run_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."run_steps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_events" ADD CONSTRAINT "execution_events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_step_id_run_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."run_steps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "handoff_records" ADD CONSTRAINT "handoff_records_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "handoff_records" ADD CONSTRAINT "handoff_records_source_run_id_agent_runs_id_fk" FOREIGN KEY ("source_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "handoff_records" ADD CONSTRAINT "handoff_records_source_step_id_run_steps_id_fk" FOREIGN KEY ("source_step_id") REFERENCES "public"."run_steps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "handoff_records" ADD CONSTRAINT "handoff_records_source_agent_id_agents_id_fk" FOREIGN KEY ("source_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "handoff_records" ADD CONSTRAINT "handoff_records_target_agent_id_agents_id_fk" FOREIGN KEY ("target_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "handoff_records" ADD CONSTRAINT "handoff_records_target_run_id_agent_runs_id_fk" FOREIGN KEY ("target_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_runs_company_agent_status_idx" ON "agent_runs" USING btree ("company_id","agent_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_runs_heartbeat_run_id_idx" ON "agent_runs" USING btree ("heartbeat_run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_runs_issue_id_idx" ON "agent_runs" USING btree ("issue_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_runs_parent_run_id_idx" ON "agent_runs" USING btree ("parent_run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_runs_company_created_idx" ON "agent_runs" USING btree ("company_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_steps_run_seq_idx" ON "run_steps" USING btree ("run_id","seq");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_steps_company_run_idx" ON "run_steps" USING btree ("company_id","run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_events_company_run_idx" ON "execution_events" USING btree ("company_id","run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_events_run_step_idx" ON "execution_events" USING btree ("run_id","step_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_events_event_type_idx" ON "execution_events" USING btree ("event_type","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_events_correlation_idx" ON "execution_events" USING btree ("correlation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entries_company_created_idx" ON "audit_entries" USING btree ("company_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entries_run_id_idx" ON "audit_entries" USING btree ("run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entries_action_idx" ON "audit_entries" USING btree ("action","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entries_entity_idx" ON "audit_entries" USING btree ("entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "handoff_records_company_status_idx" ON "handoff_records" USING btree ("company_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "handoff_records_source_run_idx" ON "handoff_records" USING btree ("source_run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "handoff_records_target_run_idx" ON "handoff_records" USING btree ("target_run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "handoff_records_source_agent_idx" ON "handoff_records" USING btree ("source_agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "handoff_records_target_agent_idx" ON "handoff_records" USING btree ("target_agent_id");
