/**
 * DeepSynaps CRM API client.
 * Hits /v1/internal/... endpoints (proxied to port 3200).
 * Separate from the Paperclip /api client.
 */

class CrmApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "CrmApiError";
    this.status = status;
    this.body = body;
  }
}

async function crmRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? undefined);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { headers, ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new CrmApiError(
      (body as { detail?: string } | null)?.detail ?? `CRM request failed: ${res.status}`,
      res.status,
      body,
    );
  }
  return res.json();
}

const crm = {
  get: <T>(path: string) => crmRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    crmRequest<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body: unknown) =>
    crmRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => crmRequest<T>(path, { method: "DELETE" }),
};

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ── Customers ────────────────────────────────────────

export interface Customer {
  customer_id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  tier: string;
  status: string;
  fleet_size: number;
  contract_value_monthly: number;
  health_score: number;
  assigned_agent_id: string | null;
  contract_start: string | null;
  contract_end: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface HealthSummary {
  total_customers: number;
  healthy: number;
  warning: number;
  at_risk: number;
  avg_health_score: number;
  at_risk_customers: Customer[];
}

export interface HealthBreakdown {
  customer_id: string;
  usage_score: number;
  support_score: number;
  engagement_score: number;
  financial_score: number;
  overall: number;
}

export interface Interaction {
  interaction_id: string;
  customer_id: string;
  agent_id: string | null;
  interaction_type: string;
  summary: string;
  sentiment: string;
  timestamp: string;
}

export interface OnboardingProgress {
  customer_id: string;
  steps: Array<{
    step_name: string;
    step_order: number;
    status: string;
    assigned_agent_id: string | null;
    due_date: string | null;
    completed_at: string | null;
    notes: string | null;
  }>;
  total: number;
  completed: number;
  progress_pct: number;
}

const C = "/v1/internal/customers";

export const customersApi = {
  list: (filters?: { status?: string; tier?: string; assigned_agent_id?: string }) =>
    crm.get<Customer[]>(`${C}${qs(filters ?? {})}`),
  get: (id: string) => crm.get<Customer>(`${C}/${id}`),
  create: (data: Partial<Customer>) => crm.post<Customer>(C, data),
  update: (id: string, data: Partial<Customer>) => crm.patch<Customer>(`${C}/${id}`, data),
  healthSummary: () => crm.get<HealthSummary>(`${C}/health-summary`),
  atRisk: (threshold?: number) => crm.get<Customer[]>(`${C}/at-risk${qs({ threshold })}`),
  getHealth: (id: string) => crm.get<HealthBreakdown>(`${C}/${id}/health`),
  listInteractions: (id: string, limit?: number) =>
    crm.get<Interaction[]>(`${C}/${id}/interactions${qs({ limit })}`),
  addInteraction: (id: string, data: Partial<Interaction>) =>
    crm.post<Interaction>(`${C}/${id}/interactions`, data),
  getOnboarding: (id: string) => crm.get<OnboardingProgress>(`${C}/${id}/onboarding`),
  updateOnboardingStep: (id: string, stepName: string, data: Record<string, unknown>) =>
    crm.patch<unknown>(`${C}/${id}/onboarding/${encodeURIComponent(stepName)}`, data),
};

// ── Tickets ──────────────────────────────────────────

export interface Ticket {
  ticket_id: string;
  ticket_number: string | null;
  customer_id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  category: string;
  source_type: string;
  assigned_team: string;
  assigned_user_id: string | null;
  escalation_level: string;
  sla_due_at: string | null;
  first_response_due_at: string | null;
  resolution_due_at: string | null;
  resolution_summary: string | null;
  created_by_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface TicketSummary {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  by_severity: Record<string, number>;
  sla_breached: number;
}

export interface TicketComment {
  comment_id: string;
  ticket_id: string;
  author_type: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  is_internal: boolean;
  created_at: string | null;
}

export interface TicketEvent {
  event_id: string;
  ticket_id: string;
  event_type: string;
  actor_type: string | null;
  actor_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string | null;
}

const T = "/v1/internal/tickets";

export const ticketsApi = {
  summary: () => crm.get<TicketSummary>(`${T}/summary`),
  list: (filters?: {
    status?: string;
    severity?: string;
    category?: string;
    assigned_team?: string;
    customer_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => crm.get<Ticket[]>(`${T}${qs(filters ?? {})}`),
  get: (id: string) => crm.get<Ticket>(`${T}/${id}`),
  create: (data: Partial<Ticket>) => crm.post<Ticket>(T, data),
  update: (id: string, data: Record<string, unknown>) => crm.patch<Ticket>(`${T}/${id}`, data),
  listComments: (id: string) => crm.get<TicketComment[]>(`${T}/${id}/comments`),
  addComment: (id: string, data: Partial<TicketComment>) =>
    crm.post<TicketComment>(`${T}/${id}/comments`, data),
  listEvents: (id: string) => crm.get<TicketEvent[]>(`${T}/${id}/events`),
  checkEscalations: () => crm.post<unknown>(`${T}/check-escalations`),
};

// ── Contracts ────────────────────────────────────────

export interface Contract {
  contract_id: string;
  customer_id: string;
  title: string;
  contract_type: string;
  status: string;
  value_monthly_cents: number;
  value_annual_cents: number;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  auto_renew: boolean;
  signed_by: string | null;
  signed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Invoice {
  invoice_id: string;
  invoice_number: string | null;
  contract_id: string | null;
  customer_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  line_items: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface Quote {
  quote_id: string;
  quote_number: string | null;
  customer_id: string;
  title: string;
  status: string;
  total_cents: number;
  valid_until: string | null;
  line_items: string | null;
  prepared_by: string | null;
  accepted_at: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface Renewal {
  renewal_id: string;
  contract_id: string | null;
  customer_id: string;
  status: string;
  current_value_cents: number;
  proposed_value_cents: number;
  renewal_date: string | null;
  risk_score: number;
  owner_agent_id: string | null;
  notes: string | null;
  last_contact: string | null;
  next_action: string | null;
  created_at: string | null;
}

const CT = "/v1/internal/contracts";

export const contractsApi = {
  list: (filters?: { customer_id?: string; status?: string }) =>
    crm.get<Contract[]>(`${CT}${qs(filters ?? {})}`),
  summary: () => crm.get<Record<string, unknown>>(`${CT}/summary`),
  expiring: (days?: number) => crm.get<Contract[]>(`${CT}/expiring${qs({ days })}`),
  get: (id: string) => crm.get<Contract>(`${CT}/${id}`),
  create: (data: Partial<Contract>) => crm.post<Contract>(CT, data),
  update: (id: string, data: Partial<Contract>) => crm.patch<Contract>(`${CT}/${id}`, data),
  listInvoices: (filters?: { customer_id?: string; status?: string }) =>
    crm.get<Invoice[]>(`${CT}/invoices${qs(filters ?? {})}`),
  overdueInvoices: () => crm.get<Invoice[]>(`${CT}/invoices/overdue`),
  createInvoice: (data: Partial<Invoice>) => crm.post<Invoice>(`${CT}/invoices`, data),
  updateInvoice: (id: string, data: Partial<Invoice>) =>
    crm.patch<Invoice>(`${CT}/invoices/${id}`, data),
  markPaid: (id: string) => crm.post<Invoice>(`${CT}/invoices/${id}/mark-paid`),
  listQuotes: (filters?: { customer_id?: string; status?: string }) =>
    crm.get<Quote[]>(`${CT}/quotes${qs(filters ?? {})}`),
  createQuote: (data: Partial<Quote>) => crm.post<Quote>(`${CT}/quotes`, data),
  acceptQuote: (id: string) => crm.post<Quote>(`${CT}/quotes/${id}/accept`),
  rejectQuote: (id: string) => crm.post<Quote>(`${CT}/quotes/${id}/reject`),
  listRenewals: (filters?: { status?: string; customer_id?: string }) =>
    crm.get<Renewal[]>(`${CT}/renewals${qs(filters ?? {})}`),
  createRenewal: (data: Partial<Renewal>) => crm.post<Renewal>(`${CT}/renewals`, data),
  updateRenewal: (id: string, data: Partial<Renewal>) =>
    crm.patch<Renewal>(`${CT}/renewals/${id}`, data),
};

// ── Marketing ────────────────────────────────────────

export interface Lead {
  lead_id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  source: string;
  status: string;
  score: number;
  assigned_agent_id: string | null;
  notes: string | null;
  first_touch: string | null;
  last_touch: string | null;
  converted_customer_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Campaign {
  campaign_id: string;
  name: string;
  campaign_type: string;
  status: string;
  budget_cents: number;
  spent_cents: number;
  start_date: string | null;
  end_date: string | null;
  target_audience: string | null;
  owner_agent_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const M = "/v1/internal/marketing";

export const marketingApi = {
  listLeads: (filters?: { status?: string; source?: string; assigned_agent_id?: string }) =>
    crm.get<Lead[]>(`${M}/leads${qs(filters ?? {})}`),
  pipeline: () => crm.get<Record<string, unknown>>(`${M}/leads/pipeline`),
  getLead: (id: string) => crm.get<Lead>(`${M}/leads/${id}`),
  createLead: (data: Partial<Lead>) => crm.post<Lead>(`${M}/leads`, data),
  updateLead: (id: string, data: Partial<Lead>) => crm.patch<Lead>(`${M}/leads/${id}`, data),
  convertLead: (id: string) => crm.post<Lead>(`${M}/leads/${id}/convert`),
  listCampaigns: (filters?: { status?: string }) =>
    crm.get<Campaign[]>(`${M}/campaigns${qs(filters ?? {})}`),
  campaignPerformance: () => crm.get<Record<string, unknown>>(`${M}/campaigns/performance`),
  getCampaign: (id: string) => crm.get<Campaign>(`${M}/campaigns/${id}`),
  createCampaign: (data: Partial<Campaign>) => crm.post<Campaign>(`${M}/campaigns`, data),
  updateCampaign: (id: string, data: Partial<Campaign>) =>
    crm.patch<Campaign>(`${M}/campaigns/${id}`, data),
};

// ── Success ──────────────────────────────────────────

const S = "/v1/internal/success";

export const successApi = {
  atRisk: () => crm.get<unknown[]>(`${S}/at-risk`),
  expansion: () => crm.get<unknown[]>(`${S}/expansion`),
  customer360: (customerId: string) => crm.get<Record<string, unknown>>(`${S}/${customerId}/360`),
  timeline: (customerId: string, limit?: number) =>
    crm.get<unknown[]>(`${S}/${customerId}/timeline${qs({ limit })}`),
  addTimelineEvent: (customerId: string, data: Record<string, unknown>) =>
    crm.post<unknown>(`${S}/${customerId}/timeline`, data),
  stakeholders: (customerId: string) => crm.get<unknown[]>(`${S}/${customerId}/stakeholders`),
  addStakeholder: (customerId: string, data: Record<string, unknown>) =>
    crm.post<unknown>(`${S}/${customerId}/stakeholders`, data),
  plans: (customerId: string) => crm.get<unknown[]>(`${S}/${customerId}/plans`),
  qbrs: (customerId: string) => crm.get<unknown[]>(`${S}/${customerId}/qbrs`),
  adoption: (customerId: string) => crm.get<unknown[]>(`${S}/${customerId}/adoption`),
  scores: (customerId: string) => crm.get<Record<string, unknown>>(`${S}/${customerId}/scores`),
  calculateScores: (customerId: string) =>
    crm.post<Record<string, unknown>>(`${S}/${customerId}/scores/calculate`),
};

// ── Operations ───────────────────────────────────────

export interface KPI {
  kpi_id: string;
  name: string;
  category: string;
  current_value: number;
  target_value: number;
  unit: string;
  period: string;
  trend: string;
  updated_at: string | null;
}

export interface OKR {
  okr_id: string;
  title: string;
  level: string;
  quarter: string;
  status: string;
  progress_pct: number;
  key_results: Array<{
    kr_id: string;
    description: string;
    target_value: number;
    current_value: number;
    unit: string;
    status: string;
  }>;
  owner_agent_id: string | null;
}

export interface FinancialSnapshot {
  snapshot_id: string;
  date: string;
  mrr: number;
  arr: number;
  burn_rate_monthly: number;
  runway_months: number;
  cash_balance: number;
  revenue_pipeline_value: number;
  agent_spend_monthly: number;
  notes: string | null;
}

export interface InvestorRecord {
  investor_id: string;
  name: string;
  firm: string;
  contact_email: string;
  stage: string;
  last_contact: string | null;
  notes: string | null;
  next_action: string | null;
  assigned_agent_id: string | null;
}

export interface HiringRecord {
  role_id: string;
  title: string;
  department: string;
  status: string;
  priority: string;
  description: string | null;
  candidates_count: number;
  opened_at: string | null;
  filled_at: string | null;
}

const O = "/v1/internal/operations";

export const operationsApi = {
  dashboard: () => crm.get<Record<string, unknown>>(`${O}/dashboard`),
  listKpis: (category?: string) => crm.get<KPI[]>(`${O}/kpis${qs({ category })}`),
  createKpi: (data: Partial<KPI>) => crm.post<KPI>(`${O}/kpis`, data),
  updateKpi: (id: string, data: Partial<KPI>) => crm.patch<KPI>(`${O}/kpis/${id}`, data),
  listOkrs: (quarter?: string, level?: string) =>
    crm.get<OKR[]>(`${O}/okrs${qs({ quarter, level })}`),
  createOkr: (data: Partial<OKR>) => crm.post<OKR>(`${O}/okrs`, data),
  updateOkr: (id: string, data: Partial<OKR>) => crm.patch<OKR>(`${O}/okrs/${id}`, data),
  latestFinancials: () => crm.get<FinancialSnapshot>(`${O}/financials`),
  financialTrend: (months?: number) =>
    crm.get<FinancialSnapshot[]>(`${O}/financials/trend${qs({ months })}`),
  listInvestors: (stage?: string) => crm.get<InvestorRecord[]>(`${O}/investors${qs({ stage })}`),
  addInvestor: (data: Partial<InvestorRecord>) => crm.post<InvestorRecord>(`${O}/investors`, data),
  updateInvestor: (id: string, data: Partial<InvestorRecord>) =>
    crm.patch<InvestorRecord>(`${O}/investors/${id}`, data),
  listRoles: (status?: string) => crm.get<HiringRecord[]>(`${O}/hiring${qs({ status })}`),
  addRole: (data: Partial<HiringRecord>) => crm.post<HiringRecord>(`${O}/hiring`, data),
  updateRole: (id: string, data: Partial<HiringRecord>) =>
    crm.patch<HiringRecord>(`${O}/hiring/${id}`, data),
};

// ── Reports ──────────────────────────────────────────

export interface Report {
  report_id: string;
  title: string;
  description: string | null;
  report_type: string;
  status: string;
  format: string;
  generated_by: string | null;
  generated_at: string | null;
  summary: string | null;
  customer_id: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string | null;
}

export interface ReportSchedule {
  schedule_id: string;
  report_type: string;
  title: string;
  frequency: string;
  next_run_at: string | null;
  last_run_at: string | null;
  enabled: boolean;
  created_by: string | null;
}

const R = "/v1/internal/reports";

export const reportsApi = {
  list: (filters?: { report_type?: string; status?: string; customer_id?: string; limit?: number }) =>
    crm.get<Report[]>(`${R}${qs(filters ?? {})}`),
  stats: () => crm.get<Record<string, unknown>>(`${R}/stats`),
  get: (id: string) => crm.get<Report>(`${R}/${id}`),
  generate: (data: { report_type: string; customer_id?: string; title?: string }) =>
    crm.post<Report>(`${R}/generate`, data),
  generateAll: () => crm.post<Report[]>(`${R}/generate/all`),
  archive: (id: string) => crm.delete<Report>(`${R}/${id}`),
  listSchedules: () => crm.get<ReportSchedule[]>(`${R}/schedules`),
  createSchedule: (data: Partial<ReportSchedule>) =>
    crm.post<ReportSchedule>(`${R}/schedules`, data),
  runDueSchedules: () => crm.post<unknown>(`${R}/schedules/run-due`),
};

// ── Playbooks ────────────────────────────────────────

export interface Playbook {
  playbook_id: string;
  name: string;
  description: string | null;
  playbook_type: string;
  status: string;
  version: number;
  trigger_type: string;
  trigger_config: string | null;
  steps: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlaybookRun {
  run_id: string;
  playbook_id: string;
  customer_id: string | null;
  ticket_id: string | null;
  trigger_event: string | null;
  status: string;
  current_step: number;
  started_at: string | null;
  completed_at: string | null;
  started_by: string | null;
  error_message: string | null;
  created_at: string | null;
}

const P = "/v1/internal/playbooks";

export const playbooksApi = {
  list: (filters?: { playbook_type?: string; status?: string }) =>
    crm.get<Playbook[]>(`${P}${qs(filters ?? {})}`),
  stats: () => crm.get<Record<string, unknown>>(`${P}/stats`),
  get: (id: string) => crm.get<Playbook>(`${P}/${id}`),
  create: (data: Partial<Playbook>) => crm.post<Playbook>(P, data),
  update: (id: string, data: Partial<Playbook>) => crm.patch<Playbook>(`${P}/${id}`, data),
  listRuns: (filters?: { playbook_id?: string; customer_id?: string; status?: string; limit?: number }) =>
    crm.get<PlaybookRun[]>(`${P}/runs${qs(filters ?? {})}`),
  activeRuns: () => crm.get<PlaybookRun[]>(`${P}/runs/active`),
  getRun: (id: string) => crm.get<PlaybookRun>(`${P}/runs/${id}`),
  startRun: (playbookId: string, data?: Record<string, unknown>) =>
    crm.post<PlaybookRun>(`${P}/${playbookId}/start`, data),
  cancelRun: (runId: string) => crm.post<PlaybookRun>(`${P}/runs/${runId}/cancel`),
};
