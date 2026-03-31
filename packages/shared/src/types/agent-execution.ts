/**
 * Paperclip Agent Execution — TypeScript interfaces for the upgraded agent
 * run/step/task/event/audit model.
 *
 * Naming conventions:
 *   - camelCase for TS interface fields
 *   - snake_case for DB columns (see companion Drizzle tables at the bottom)
 *   - Const-tuple enums following the existing `as const` pattern
 */

// ---------------------------------------------------------------------------
// Enums (const-tuple style, matching existing Paperclip conventions)
// ---------------------------------------------------------------------------

export const AGENT_RUN_STATUSES = [
  "queued",
  "initializing",
  "running",
  "paused",
  "awaiting_approval",
  "succeeded",
  "failed",
  "cancelled",
  "timed_out",
] as const;
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const RUN_STEP_STATUSES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "skipped",
  "cancelled",
] as const;
export type RunStepStatus = (typeof RUN_STEP_STATUSES)[number];

export const RUN_STEP_TYPES = [
  "tool_call",
  "reasoning",
  "code_edit",
  "shell_command",
  "approval_gate",
  "handoff",
  "checkpoint",
  "custom",
] as const;
export type RunStepType = (typeof RUN_STEP_TYPES)[number];

export const TASK_STATUSES = [
  "pending",
  "ready",
  "in_progress",
  "blocked",
  "succeeded",
  "failed",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_DEPENDENCY_TYPES = [
  "finish_to_start",
  "start_to_start",
  "data",
] as const;
export type TaskDependencyType = (typeof TASK_DEPENDENCY_TYPES)[number];

export const EXECUTION_EVENT_TYPES = [
  "run.started",
  "run.completed",
  "run.failed",
  "run.cancelled",
  "step.started",
  "step.completed",
  "step.failed",
  "task.created",
  "task.status_changed",
  "approval.requested",
  "approval.granted",
  "approval.denied",
  "handoff.initiated",
  "handoff.accepted",
  "handoff.rejected",
  "tool.invoked",
  "tool.completed",
  "artifact.created",
  "policy.violated",
  "secret.accessed",
] as const;
export type ExecutionEventType = (typeof EXECUTION_EVENT_TYPES)[number];

export const EVENT_SEVERITIES = ["debug", "info", "warn", "error", "critical"] as const;
export type EventSeverity = (typeof EVENT_SEVERITIES)[number];

export const APPROVAL_REQUEST_STATUSES = [
  "pending",
  "approved",
  "denied",
  "expired",
  "auto_approved",
] as const;
export type ApprovalRequestStatus = (typeof APPROVAL_REQUEST_STATUSES)[number];

export const AUDIT_ACTIONS = [
  "run.create",
  "run.cancel",
  "run.pause",
  "run.resume",
  "step.execute",
  "task.assign",
  "task.reassign",
  "approval.request",
  "approval.decide",
  "handoff.initiate",
  "handoff.accept",
  "secret.read",
  "policy.override",
  "artifact.upload",
  "tool.invoke",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const ARTIFACT_TYPES = [
  "file",
  "log",
  "diff",
  "screenshot",
  "report",
  "metric",
  "custom",
] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const TOOL_INVOCATION_STATUSES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "timed_out",
] as const;
export type ToolInvocationStatus = (typeof TOOL_INVOCATION_STATUSES)[number];

export const HANDOFF_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "timed_out",
] as const;
export type HandoffStatus = (typeof HANDOFF_STATUSES)[number];

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Extended agent run with richer lifecycle state than heartbeat_runs. */
export interface AgentRun {
  id: string;
  /** FK -> companies.id */
  companyId: string;
  /** FK -> agents.id */
  agentId: string;
  /** FK -> heartbeat_runs.id — links back to the original heartbeat row */
  heartbeatRunId: string | null;
  /** FK -> issues.id — the issue this run is working on */
  issueId: string | null;
  /** FK -> agent_runs.id — parent run for nested/recursive execution */
  parentRunId: string | null;
  status: AgentRunStatus;
  invocationSource: string;
  triggerDetail: string | null;
  /** High-level goal or instruction for this run */
  prompt: string | null;
  /** Model identifier used (e.g. "claude-opus-4-20250514") */
  model: string | null;
  /** Execution policy snapshot applied to this run */
  executionPolicyJson: ExecutionPolicy | null;
  /** Retry policy snapshot applied to this run */
  retryPolicyJson: RetryPolicy | null;
  /** Current retry attempt (0-based) */
  attemptNumber: number;
  /** Accumulated token usage */
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  /** Cost in cents */
  costCents: number;
  /** Total steps executed */
  stepCount: number;
  /** Total tool invocations */
  toolCallCount: number;
  /** Serialised adapter session state */
  sessionSnapshot: Record<string, unknown> | null;
  error: string | null;
  errorCode: string | null;
  resultJson: Record<string, unknown> | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  /** Deadline after which the run auto-cancels */
  deadlineAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A single discrete step within an AgentRun. */
export interface RunStep {
  id: string;
  /** FK -> agent_runs.id */
  runId: string;
  /** FK -> companies.id */
  companyId: string;
  /** FK -> agents.id */
  agentId: string;
  /** Monotonically increasing within the run */
  seq: number;
  type: RunStepType;
  status: RunStepStatus;
  /** Human-readable label (e.g. "Read file src/index.ts") */
  name: string | null;
  /** Input provided to this step */
  inputJson: Record<string, unknown> | null;
  /** Output produced by this step */
  outputJson: Record<string, unknown> | null;
  /** Tokens consumed in this step */
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  /** FK -> tool_invocations.id if type == "tool_call" */
  toolInvocationId: string | null;
  /** FK -> approval_requests.id if type == "approval_gate" */
  approvalRequestId: string | null;
  /** FK -> handoff_records.id if type == "handoff" */
  handoffRecordId: string | null;
  error: string | null;
  durationMs: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
}

/** A work item with dependency tracking, owned by a run or standalone. */
export interface Task {
  id: string;
  /** FK -> companies.id */
  companyId: string;
  /** FK -> agent_runs.id — the run that created/owns this task */
  runId: string | null;
  /** FK -> issues.id — linked issue */
  issueId: string | null;
  /** FK -> agents.id — agent assigned to execute */
  assignedAgentId: string | null;
  /** FK -> agents.id — agent that created the task */
  createdByAgentId: string | null;
  status: TaskStatus;
  title: string;
  description: string | null;
  /** Priority (lower = higher priority) */
  priority: number;
  /** Estimated effort in minutes */
  estimateMinutes: number | null;
  inputJson: Record<string, unknown> | null;
  outputJson: Record<string, unknown> | null;
  error: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  /** Deadline for completion */
  deadlineAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Declares that one task depends on another. */
export interface TaskDependency {
  id: string;
  /** FK -> tasks.id */
  taskId: string;
  /** FK -> tasks.id */
  dependsOnTaskId: string;
  type: TaskDependencyType;
  /** If type == "data", the key in outputJson to forward */
  dataKey: string | null;
  createdAt: Date;
}

/** Event bus event — immutable append-only log. */
export interface ExecutionEvent {
  id: string;
  /** FK -> companies.id */
  companyId: string;
  /** FK -> agent_runs.id */
  runId: string | null;
  /** FK -> run_steps.id */
  stepId: string | null;
  /** FK -> agents.id — the agent that emitted the event */
  agentId: string | null;
  eventType: ExecutionEventType;
  severity: EventSeverity;
  message: string | null;
  payload: Record<string, unknown> | null;
  /** Correlation ID for tracing across runs/agents */
  correlationId: string | null;
  createdAt: Date;
}

/** Request for human or policy-engine approval before proceeding. */
export interface ApprovalRequest {
  id: string;
  /** FK -> companies.id */
  companyId: string;
  /** FK -> agent_runs.id */
  runId: string;
  /** FK -> run_steps.id — the step that is blocked */
  stepId: string | null;
  /** FK -> agents.id — the requesting agent */
  requestedByAgentId: string;
  status: ApprovalRequestStatus;
  /** What the agent wants to do */
  actionDescription: string;
  /** Why approval is needed */
  reason: string | null;
  /** Structured context for the reviewer */
  contextJson: Record<string, unknown> | null;
  /** Who approved/denied (user ID or "policy_engine") */
  decidedBy: string | null;
  decisionNote: string | null;
  decidedAt: Date | null;
  /** Auto-expire after this time */
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Immutable audit trail for compliance and debugging. */
export interface AuditEntry {
  id: string;
  /** FK -> companies.id */
  companyId: string;
  /** FK -> agent_runs.id */
  runId: string | null;
  /** FK -> run_steps.id */
  stepId: string | null;
  /** FK -> agents.id */
  agentId: string | null;
  /** "user" | "agent" | "system" */
  actorType: string;
  /** User ID or agent ID */
  actorId: string;
  action: AuditAction;
  /** Type of the target entity */
  entityType: string | null;
  /** ID of the target entity */
  entityId: string | null;
  /** Before-state for mutations */
  beforeJson: Record<string, unknown> | null;
  /** After-state for mutations */
  afterJson: Record<string, unknown> | null;
  /** Additional metadata */
  metadata: Record<string, unknown> | null;
  /** Client IP if available */
  ipAddress: string | null;
  createdAt: Date;
}

/** Reference to a secret that was accessed during execution (never stores the value). */
export interface SecretReference {
  id: string;
  /** FK -> companies.id */
  companyId: string;
  /** FK -> agent_runs.id */
  runId: string;
  /** FK -> run_steps.id */
  stepId: string | null;
  /** FK -> agents.id */
  agentId: string;
  /** FK -> company_secrets.id */
  secretId: string;
  /** Secret name at the time of access */
  secretName: string;
  /** "read" | "inject" */
  accessType: string;
  /** Whether the agent was authorized */
  authorized: boolean;
  createdAt: Date;
}

/** A tangible output produced by a run or step. */
export interface Artifact {
  id: string;
  /** FK -> companies.id */
  companyId: string;
  /** FK -> agent_runs.id */
  runId: string;
  /** FK -> run_steps.id */
  stepId: string | null;
  /** FK -> agents.id */
  agentId: string;
  type: ArtifactType;
  /** Human-readable name */
  name: string;
  /** MIME type */
  mimeType: string | null;
  /** Size in bytes */
  sizeBytes: number | null;
  /** Storage backend: "inline" | "s3" | "local_disk" */
  storageProvider: string;
  /** Reference/path/key in the storage backend */
  storageRef: string;
  /** SHA-256 digest of content */
  sha256: string | null;
  /** Structured metadata */
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

/** Record of a single tool invocation by an agent. */
export interface ToolInvocation {
  id: string;
  /** FK -> companies.id */
  companyId: string;
  /** FK -> agent_runs.id */
  runId: string;
  /** FK -> run_steps.id */
  stepId: string;
  /** FK -> agents.id */
  agentId: string;
  /** Tool name (e.g. "Read", "Bash", "Edit") */
  toolName: string;
  /** Unique call ID from the model */
  toolCallId: string | null;
  status: ToolInvocationStatus;
  /** Arguments passed to the tool */
  inputJson: Record<string, unknown> | null;
  /** Tool output */
  outputJson: Record<string, unknown> | null;
  /** Truncated output preview for display */
  outputPreview: string | null;
  error: string | null;
  durationMs: number | null;
  /** Whether this invocation required approval */
  approvalRequired: boolean;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
}

/** Policy governing how an agent run may execute. */
export interface ExecutionPolicy {
  /** Maximum wall-clock time in seconds */
  maxDurationSeconds?: number;
  /** Maximum number of steps before auto-stop */
  maxSteps?: number;
  /** Maximum number of tool calls before auto-stop */
  maxToolCalls?: number;
  /** Maximum cost in cents before auto-stop */
  maxCostCents?: number;
  /** Tools that the agent is allowed to invoke */
  allowedTools?: string[];
  /** Tools that are explicitly denied */
  deniedTools?: string[];
  /** Whether approval is required before tool calls that mutate state */
  requireApprovalForMutations?: boolean;
  /** Whether the agent may hand off to other agents */
  allowHandoffs?: boolean;
  /** Maximum depth for nested/recursive runs */
  maxHandoffDepth?: number;
  /** Whether secrets may be injected */
  allowSecretAccess?: boolean;
  /** Network access policy: "none" | "internal" | "unrestricted" */
  networkAccess?: string;
  /** Workspace isolation: "shared" | "isolated" | "ephemeral" */
  workspaceIsolation?: string;
}

/** Policy controlling retry behavior on step or run failure. */
export interface RetryPolicy {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Initial backoff in milliseconds */
  initialBackoffMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Maximum backoff in milliseconds */
  maxBackoffMs: number;
  /** Error codes that are retryable */
  retryableErrors?: string[];
  /** Error codes that should never be retried */
  nonRetryableErrors?: string[];
}

/** Records a handoff of work from one agent to another. */
export interface HandoffRecord {
  id: string;
  /** FK -> companies.id */
  companyId: string;
  /** FK -> agent_runs.id — the source run initiating the handoff */
  sourceRunId: string;
  /** FK -> run_steps.id — the step that triggered the handoff */
  sourceStepId: string | null;
  /** FK -> agents.id — the agent handing off */
  sourceAgentId: string;
  /** FK -> agents.id — the agent receiving the handoff */
  targetAgentId: string;
  /** FK -> agent_runs.id — the run created for the target agent */
  targetRunId: string | null;
  status: HandoffStatus;
  /** Reason for the handoff */
  reason: string | null;
  /** Instructions/context passed to the target agent */
  contextJson: Record<string, unknown> | null;
  /** Result returned by the target agent */
  resultJson: Record<string, unknown> | null;
  /** Depth level in a handoff chain (0 = original) */
  depth: number;
  acceptedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
