/**
 * Seed/mock data for CRM pages.
 * Used as fallback when the DeepSynaps API is not reachable.
 */

import type {
  Customer, HealthSummary, HealthBreakdown, Interaction, OnboardingProgress,
  Ticket, TicketSummary, TicketComment, TicketEvent,
  Contract, Invoice, Quote, Renewal,
  Lead, Campaign,
  KPI, OKR, FinancialSnapshot, InvestorRecord, HiringRecord,
  Report, ReportSchedule,
  Playbook, PlaybookRun,
} from "./crm";

const now = new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

// ── Customers ────────────────────────────────────────

export const seedCustomers: Customer[] = [
  {
    customer_id: "cust-001", company_name: "Nextera AI Labs", contact_name: "James Chen",
    contact_email: "james@nextera.ai", tier: "enterprise", status: "active", fleet_size: 128,
    contract_value_monthly: 320000, health_score: 87, assigned_agent_id: "success-agent",
    contract_start: "2025-09-01", contract_end: "2026-08-31", notes: "Strategic partner, expanding to EU cluster", created_at: daysAgo(180), updated_at: daysAgo(1),
  },
  {
    customer_id: "cust-002", company_name: "Quantum Render Co", contact_name: "Sarah Miller",
    contact_email: "sarah@quantumrender.io", tier: "pro", status: "active", fleet_size: 64,
    contract_value_monthly: 160000, health_score: 72, assigned_agent_id: "success-agent",
    contract_start: "2025-11-01", contract_end: "2026-10-31", notes: "Considering upgrade to enterprise", created_at: daysAgo(120), updated_at: daysAgo(3),
  },
  {
    customer_id: "cust-003", company_name: "DeepMind Solutions", contact_name: "Arun Patel",
    contact_email: "arun@deepmindsol.com", tier: "enterprise", status: "active", fleet_size: 240,
    contract_value_monthly: 600000, health_score: 93, assigned_agent_id: "success-agent",
    contract_start: "2025-06-01", contract_end: "2026-05-31", notes: "Largest customer, reference account", created_at: daysAgo(300), updated_at: daysAgo(1),
  },
  {
    customer_id: "cust-004", company_name: "Stratos Computing", contact_name: "Elena Volkov",
    contact_email: "elena@stratos.dev", tier: "starter", status: "pilot", fleet_size: 16,
    contract_value_monthly: 40000, health_score: 55, assigned_agent_id: "sales-agent",
    contract_start: "2026-02-01", contract_end: "2026-04-30", notes: "Pilot evaluation, 30-day trial", created_at: daysAgo(45), updated_at: daysAgo(2),
  },
  {
    customer_id: "cust-005", company_name: "Neural Bridge Inc", contact_name: "David Kim",
    contact_email: "david@neuralbridge.io", tier: "pro", status: "active", fleet_size: 48,
    contract_value_monthly: 120000, health_score: 34, assigned_agent_id: "success-agent",
    contract_start: "2025-12-01", contract_end: "2026-11-30", notes: "At risk — ticket volume increasing, engagement low", created_at: daysAgo(100), updated_at: daysAgo(1),
  },
  {
    customer_id: "cust-006", company_name: "Apex Cluster Labs", contact_name: "Maria Santos",
    contact_email: "maria@apexcluster.com", tier: "enterprise", status: "active", fleet_size: 192,
    contract_value_monthly: 480000, health_score: 81, assigned_agent_id: "success-agent",
    contract_start: "2025-08-01", contract_end: "2026-07-31", notes: "Renewal discussion scheduled Q2", created_at: daysAgo(240), updated_at: daysAgo(5),
  },
  {
    customer_id: "cust-007", company_name: "Vortex Data Systems", contact_name: "Tom Harris",
    contact_email: "tom@vortexdata.co", tier: "starter", status: "churned", fleet_size: 8,
    contract_value_monthly: 20000, health_score: 12, assigned_agent_id: null,
    contract_start: "2025-10-01", contract_end: "2026-01-31", notes: "Churned — budget constraints", created_at: daysAgo(160), updated_at: daysAgo(60),
  },
  {
    customer_id: "cust-008", company_name: "Horizon ML", contact_name: "Lisa Zhang",
    contact_email: "lisa@horizonml.ai", tier: "pro", status: "prospect", fleet_size: 32,
    contract_value_monthly: 0, health_score: 50, assigned_agent_id: "sales-agent",
    contract_start: null, contract_end: null, notes: "Demo scheduled for next week", created_at: daysAgo(14), updated_at: daysAgo(1),
  },
];

export const seedHealthSummary: HealthSummary = {
  total_customers: 8, healthy: 4, warning: 2, at_risk: 2,
  avg_health_score: 60.5, at_risk_customers: seedCustomers.filter((c) => c.health_score < 40),
};

export const seedHealthBreakdown = (id: string): HealthBreakdown => {
  const c = seedCustomers.find((x) => x.customer_id === id);
  const base = c?.health_score ?? 50;
  return {
    customer_id: id, usage_score: Math.min(100, base + 10),
    support_score: Math.min(100, base - 5), engagement_score: Math.min(100, base + 3),
    financial_score: Math.min(100, base + 7), overall: base,
  };
};

export const seedInteractions = (id: string): Interaction[] => [
  { interaction_id: "int-1", customer_id: id, agent_id: "success-agent", interaction_type: "meeting", summary: "QBR review — discussed expansion plans and current utilization rates", sentiment: "positive", timestamp: daysAgo(3) },
  { interaction_id: "int-2", customer_id: id, agent_id: "support-agent", interaction_type: "support", summary: "Resolved thermal throttling on node gpu-14, firmware update applied", sentiment: "neutral", timestamp: daysAgo(7) },
  { interaction_id: "int-3", customer_id: id, agent_id: "success-agent", interaction_type: "email", summary: "Sent monthly performance report showing 14% efficiency gain", sentiment: "positive", timestamp: daysAgo(14) },
  { interaction_id: "int-4", customer_id: id, agent_id: "sales-agent", interaction_type: "call", summary: "Discussed enterprise upgrade path and additional GPU allocation", sentiment: "positive", timestamp: daysAgo(21) },
];

export const seedOnboarding = (id: string): OnboardingProgress => ({
  customer_id: id, total: 8, completed: 6, progress_pct: 75,
  steps: [
    { step_name: "Contract signed", step_order: 1, status: "done", assigned_agent_id: "sales-agent", due_date: null, completed_at: daysAgo(30), notes: null },
    { step_name: "API keys provisioned", step_order: 2, status: "done", assigned_agent_id: "platform-engineer", due_date: null, completed_at: daysAgo(28), notes: null },
    { step_name: "Agent deployed to cluster", step_order: 3, status: "done", assigned_agent_id: "devops-agent", due_date: null, completed_at: daysAgo(25), notes: null },
    { step_name: "Baseline telemetry recorded", step_order: 4, status: "done", assigned_agent_id: "gpu-engineer", due_date: null, completed_at: daysAgo(20), notes: null },
    { step_name: "First optimization cycle (dry-run)", step_order: 5, status: "done", assigned_agent_id: "ml-engineer", due_date: null, completed_at: daysAgo(15), notes: null },
    { step_name: "Dashboard access configured", step_order: 6, status: "done", assigned_agent_id: "platform-engineer", due_date: null, completed_at: daysAgo(10), notes: null },
    { step_name: "Training session completed", step_order: 7, status: "in_progress", assigned_agent_id: "success-agent", due_date: daysAgo(-5), completed_at: null, notes: "Scheduled for next Tuesday" },
    { step_name: "Go-live confirmation", step_order: 8, status: "pending", assigned_agent_id: "success-agent", due_date: daysAgo(-10), completed_at: null, notes: null },
  ],
});

// ── Tickets ──────────────────────────────────────────

export const seedTickets: Ticket[] = [
  { ticket_id: "tkt-001", ticket_number: "PFX-1001", customer_id: "cust-005", title: "GPU utilization dropping below baseline after optimization", description: "Cluster nodes 12-18 showing 15% drop", status: "open", severity: "high", category: "performance", source_type: "agent", assigned_team: "engineering", assigned_user_id: null, escalation_level: "l1", sla_due_at: daysAgo(-1), first_response_due_at: daysAgo(0), resolution_due_at: daysAgo(-2), resolution_summary: null, created_by_name: "support-agent", created_at: daysAgo(1), updated_at: daysAgo(0), resolved_at: null, closed_at: null },
  { ticket_id: "tkt-002", ticket_number: "PFX-1002", customer_id: "cust-001", title: "Request for custom DVFS governor configuration", description: "Customer wants aggressive power saving during off-peak", status: "in_progress", severity: "medium", category: "support", source_type: "portal", assigned_team: "platform", assigned_user_id: null, escalation_level: "none", sla_due_at: daysAgo(-3), first_response_due_at: null, resolution_due_at: daysAgo(-5), resolution_summary: null, created_by_name: "James Chen", created_at: daysAgo(3), updated_at: daysAgo(1), resolved_at: null, closed_at: null },
  { ticket_id: "tkt-003", ticket_number: "PFX-1003", customer_id: "cust-003", title: "Thermal alert on rack B nodes — ECC errors detected", description: "3 nodes reporting memory errors", status: "open", severity: "critical", category: "incident", source_type: "system", assigned_team: "engineering", assigned_user_id: null, escalation_level: "l2", sla_due_at: daysAgo(0), first_response_due_at: null, resolution_due_at: daysAgo(-0.5), resolution_summary: null, created_by_name: "system", created_at: daysAgo(0), updated_at: daysAgo(0), resolved_at: null, closed_at: null },
  { ticket_id: "tkt-004", ticket_number: "PFX-1004", customer_id: "cust-002", title: "Billing discrepancy on February invoice", description: "Invoice shows 80 GPUs, contract is for 64", status: "waiting_customer", severity: "low", category: "billing", source_type: "portal", assigned_team: "finops", assigned_user_id: null, escalation_level: "none", sla_due_at: daysAgo(-5), first_response_due_at: null, resolution_due_at: daysAgo(-7), resolution_summary: null, created_by_name: "Sarah Miller", created_at: daysAgo(5), updated_at: daysAgo(2), resolved_at: null, closed_at: null },
  { ticket_id: "tkt-005", ticket_number: "PFX-1005", customer_id: "cust-006", title: "Feature request: multi-region fleet dashboard", description: "Customer expanding to EU, wants unified view", status: "triaged", severity: "low", category: "feature_request", source_type: "portal", assigned_team: "engineering", assigned_user_id: null, escalation_level: "none", sla_due_at: null, first_response_due_at: null, resolution_due_at: null, resolution_summary: null, created_by_name: "Maria Santos", created_at: daysAgo(8), updated_at: daysAgo(6), resolved_at: null, closed_at: null },
  { ticket_id: "tkt-006", ticket_number: "PFX-1006", customer_id: "cust-001", title: "Deployment rollback after failed optimization cycle", description: "Optimization cycle #487 caused power spike", status: "resolved", severity: "high", category: "incident", source_type: "agent", assigned_team: "engineering", assigned_user_id: null, escalation_level: "none", sla_due_at: null, first_response_due_at: null, resolution_due_at: null, resolution_summary: "Rolled back to previous governor profile. Root cause: incorrect thermal threshold in config.", created_by_name: "actions-agent", created_at: daysAgo(12), updated_at: daysAgo(10), resolved_at: daysAgo(10), closed_at: daysAgo(10) },
];

export const seedTicketSummary: TicketSummary = {
  total: 6, open: 2, in_progress: 1, resolved: 1, closed: 0,
  by_severity: { critical: 1, high: 2, medium: 1, low: 2 }, sla_breached: 1,
};

export const seedTicketComments = (id: string): TicketComment[] => [
  { comment_id: "cmt-1", ticket_id: id, author_type: "agent", author_id: "support-agent", author_name: "Support Agent", body: "Investigating the issue. Initial analysis shows the optimization parameters were set too aggressively for this workload type.", is_internal: false, created_at: daysAgo(1) },
  { comment_id: "cmt-2", ticket_id: id, author_type: "internal_user", author_id: null, author_name: "David (CTO)", body: "Need to check DVFS governor config for this cluster. The thermal profiles may need recalibration.", is_internal: true, created_at: daysAgo(0.5) },
  { comment_id: "cmt-3", ticket_id: id, author_type: "agent", author_id: "coordination-agent", author_name: "Coordination Agent", body: "SLA clock started. First response SLA: 2h. Resolution SLA: 24h.", is_internal: true, created_at: daysAgo(1) },
];

export const seedTicketEvents = (id: string): TicketEvent[] => [
  { event_id: "evt-1", ticket_id: id, event_type: "status_changed", actor_type: "system", actor_name: "System", old_value: null, new_value: "open", created_at: daysAgo(1) },
  { event_id: "evt-2", ticket_id: id, event_type: "assigned", actor_type: "agent", actor_name: "Coordination Agent", old_value: null, new_value: "engineering", created_at: daysAgo(1) },
  { event_id: "evt-3", ticket_id: id, event_type: "escalated", actor_type: "agent", actor_name: "Coordination Agent", old_value: "none", new_value: "l1", created_at: daysAgo(0.5) },
];

// ── Contracts ────────────────────────────────────────

export const seedContracts: Contract[] = [
  { contract_id: "con-001", customer_id: "cust-003", title: "DeepMind Solutions — Enterprise Annual", contract_type: "annual", status: "active", value_monthly_cents: 600000, value_annual_cents: 7200000, start_date: "2025-06-01", end_date: "2026-05-31", renewal_date: "2026-04-01", auto_renew: true, signed_by: "Arun Patel", signed_at: "2025-05-20", created_at: daysAgo(300), updated_at: daysAgo(30) },
  { contract_id: "con-002", customer_id: "cust-001", title: "Nextera AI — Enterprise Annual", contract_type: "annual", status: "active", value_monthly_cents: 320000, value_annual_cents: 3840000, start_date: "2025-09-01", end_date: "2026-08-31", renewal_date: "2026-07-01", auto_renew: true, signed_by: "James Chen", signed_at: "2025-08-25", created_at: daysAgo(180), updated_at: daysAgo(15) },
  { contract_id: "con-003", customer_id: "cust-006", title: "Apex Cluster — Enterprise Annual", contract_type: "annual", status: "expiring", value_monthly_cents: 480000, value_annual_cents: 5760000, start_date: "2025-08-01", end_date: "2026-07-31", renewal_date: "2026-06-01", auto_renew: false, signed_by: "Maria Santos", signed_at: "2025-07-28", created_at: daysAgo(240), updated_at: daysAgo(5) },
  { contract_id: "con-004", customer_id: "cust-004", title: "Stratos Computing — Pilot", contract_type: "monthly", status: "active", value_monthly_cents: 40000, value_annual_cents: 0, start_date: "2026-02-01", end_date: "2026-04-30", renewal_date: null, auto_renew: false, signed_by: "Elena Volkov", signed_at: "2026-01-28", created_at: daysAgo(45), updated_at: daysAgo(10) },
];

export const seedContractSummary = {
  total_contracts: 4, active: 3, expiring: 1,
  total_mrr_cents: 1540000, total_arr_cents: 18480000,
  overdue_invoices: 1, pending_renewals: 2,
};

export const seedInvoices: Invoice[] = [
  { invoice_id: "inv-001", invoice_number: "INV-2026-001", contract_id: "con-001", customer_id: "cust-003", amount_cents: 600000, currency: "USD", status: "paid", due_date: "2026-03-01", paid_date: "2026-02-28", line_items: null, notes: null, created_at: daysAgo(30) },
  { invoice_id: "inv-002", invoice_number: "INV-2026-002", contract_id: "con-002", customer_id: "cust-001", amount_cents: 320000, currency: "USD", status: "sent", due_date: "2026-04-01", paid_date: null, line_items: null, notes: null, created_at: daysAgo(5) },
  { invoice_id: "inv-003", invoice_number: "INV-2026-003", contract_id: "con-003", customer_id: "cust-006", amount_cents: 480000, currency: "USD", status: "overdue", due_date: "2026-03-15", paid_date: null, line_items: null, notes: "Payment reminder sent", created_at: daysAgo(20) },
];

export const seedQuotes: Quote[] = [
  { quote_id: "qt-001", quote_number: "QT-2026-001", customer_id: "cust-008", title: "Horizon ML — Pro Plan (32 GPUs)", status: "sent", total_cents: 960000, valid_until: daysAgo(-14), line_items: null, prepared_by: "sales-agent", accepted_at: null, notes: "Annual contract, 32 H100 GPUs", created_at: daysAgo(7) },
  { quote_id: "qt-002", quote_number: "QT-2026-002", customer_id: "cust-002", title: "Quantum Render — Enterprise Upgrade", status: "draft", total_cents: 3840000, valid_until: daysAgo(-30), line_items: null, prepared_by: "sales-agent", accepted_at: null, notes: "Upgrade from Pro to Enterprise, 128 GPUs", created_at: daysAgo(3) },
];

export const seedRenewals: Renewal[] = [
  { renewal_id: "ren-001", contract_id: "con-003", customer_id: "cust-006", status: "in_progress", current_value_cents: 5760000, proposed_value_cents: 6480000, renewal_date: "2026-06-01", risk_score: 35, owner_agent_id: "billing-agent", notes: "Customer requesting 12% discount", last_contact: daysAgo(5), next_action: "Send revised proposal", created_at: daysAgo(30) },
  { renewal_id: "ren-002", contract_id: "con-001", customer_id: "cust-001", status: "upcoming", current_value_cents: 3840000, proposed_value_cents: 4800000, renewal_date: "2026-07-01", risk_score: 15, owner_agent_id: "success-agent", notes: "Expanding fleet — upsell opportunity", last_contact: daysAgo(3), next_action: "QBR scheduled April 10", created_at: daysAgo(14) },
];

// ── Marketing ────────────────────────────────────────

export const seedLeads: Lead[] = [
  { lead_id: "lead-001", company_name: "Horizon ML", contact_name: "Lisa Zhang", contact_email: "lisa@horizonml.ai", source: "inbound", status: "qualified", score: 82, assigned_agent_id: "sales-agent", notes: "Demo completed, very interested", first_touch: daysAgo(30), last_touch: daysAgo(1), converted_customer_id: null, created_at: daysAgo(30), updated_at: daysAgo(1) },
  { lead_id: "lead-002", company_name: "CloudForge Systems", contact_name: "Ryan O'Brien", contact_email: "ryan@cloudforge.io", source: "event", status: "contacted", score: 65, assigned_agent_id: "marketing-agent", notes: "Met at GTC 2026", first_touch: daysAgo(14), last_touch: daysAgo(5), converted_customer_id: null, created_at: daysAgo(14), updated_at: daysAgo(5) },
  { lead_id: "lead-003", company_name: "DataPulse AI", contact_name: "Mei Wang", contact_email: "mei@datapulse.ai", source: "content", status: "new", score: 45, assigned_agent_id: "marketing-agent", notes: "Downloaded GPU optimization whitepaper", first_touch: daysAgo(3), last_touch: daysAgo(3), converted_customer_id: null, created_at: daysAgo(3), updated_at: daysAgo(3) },
  { lead_id: "lead-004", company_name: "TensorScale Inc", contact_name: "Alex Rivera", contact_email: "alex@tensorscale.com", source: "referral", status: "nurturing", score: 58, assigned_agent_id: "sales-agent", notes: "Referred by Nextera AI", first_touch: daysAgo(45), last_touch: daysAgo(10), converted_customer_id: null, created_at: daysAgo(45), updated_at: daysAgo(10) },
  { lead_id: "lead-005", company_name: "OmniCompute", contact_name: "Priya Sharma", contact_email: "priya@omnicompute.io", source: "outbound", status: "lost", score: 20, assigned_agent_id: null, notes: "No budget this quarter", first_touch: daysAgo(60), last_touch: daysAgo(30), converted_customer_id: null, created_at: daysAgo(60), updated_at: daysAgo(30) },
];

export const seedPipeline = {
  by_status: { new: 1, contacted: 1, qualified: 1, nurturing: 1, converted: 0, lost: 1 },
  total: 5, conversion_rate: 12.5, avg_score: 54,
};

export const seedCampaigns: Campaign[] = [
  { campaign_id: "camp-001", name: "GTC 2026 Follow-up", campaign_type: "email", status: "active", budget_cents: 500000, spent_cents: 180000, start_date: "2026-03-20", end_date: "2026-04-20", target_audience: "AI infrastructure teams", owner_agent_id: "marketing-agent", created_at: daysAgo(10), updated_at: daysAgo(1) },
  { campaign_id: "camp-002", name: "GPU Optimization Whitepaper", campaign_type: "content", status: "completed", budget_cents: 200000, spent_cents: 195000, start_date: "2026-01-15", end_date: "2026-03-15", target_audience: "ML engineers, DevOps", owner_agent_id: "marketing-agent", created_at: daysAgo(70), updated_at: daysAgo(15) },
  { campaign_id: "camp-003", name: "H100 Cost Reduction Webinar", campaign_type: "webinar", status: "draft", budget_cents: 300000, spent_cents: 0, start_date: "2026-04-15", end_date: "2026-04-15", target_audience: "FinOps, CTO", owner_agent_id: "marketing-agent", created_at: daysAgo(5), updated_at: daysAgo(2) },
];

// ── Operations ───────────────────────────────────────

export const seedKpis: KPI[] = [
  { kpi_id: "kpi-001", name: "Monthly Recurring Revenue", category: "revenue", current_value: 15400, target_value: 20000, unit: "USD", period: "monthly", trend: "up", updated_at: daysAgo(1) },
  { kpi_id: "kpi-002", name: "Customer Health Score (avg)", category: "support", current_value: 60.5, target_value: 75, unit: "score", period: "monthly", trend: "flat", updated_at: daysAgo(1) },
  { kpi_id: "kpi-003", name: "Fleet Utilization", category: "engineering", current_value: 78, target_value: 85, unit: "%", period: "weekly", trend: "up", updated_at: daysAgo(2) },
  { kpi_id: "kpi-004", name: "Ticket Resolution Time", category: "support", current_value: 4.2, target_value: 3, unit: "hours", period: "weekly", trend: "down", updated_at: daysAgo(1) },
  { kpi_id: "kpi-005", name: "Pipeline Value", category: "sales", current_value: 48000, target_value: 60000, unit: "USD", period: "monthly", trend: "up", updated_at: daysAgo(3) },
  { kpi_id: "kpi-006", name: "Agent Task Completion Rate", category: "operations", current_value: 94, target_value: 98, unit: "%", period: "weekly", trend: "up", updated_at: daysAgo(1) },
];

export const seedOkrs: OKR[] = [
  { okr_id: "okr-001", title: "Scale revenue to $20k MRR", level: "company", quarter: "2026-Q2", status: "on_track", progress_pct: 77, key_results: [
    { kr_id: "kr-1", description: "Close 3 new enterprise contracts", target_value: 3, current_value: 1, unit: "contracts", status: "at_risk" },
    { kr_id: "kr-2", description: "Convert 2 pilots to paid", target_value: 2, current_value: 1, unit: "conversions", status: "on_track" },
    { kr_id: "kr-3", description: "Reduce churn to <5%", target_value: 5, current_value: 3, unit: "%", status: "on_track" },
  ], owner_agent_id: "cfo-agent" },
  { okr_id: "okr-002", title: "Achieve 95%+ fleet optimization efficiency", level: "team", quarter: "2026-Q2", status: "on_track", progress_pct: 85, key_results: [
    { kr_id: "kr-4", description: "Reduce avg optimization cycle time to <30min", target_value: 30, current_value: 28, unit: "minutes", status: "completed" },
    { kr_id: "kr-5", description: "Zero critical incidents from optimization", target_value: 0, current_value: 1, unit: "incidents", status: "at_risk" },
  ], owner_agent_id: "cto-agent" },
];

export const seedFinancials: FinancialSnapshot = {
  snapshot_id: "fin-001", date: now, mrr: 1540000, arr: 18480000,
  burn_rate_monthly: 890000, runway_months: 14.2, cash_balance: 12600000,
  revenue_pipeline_value: 4800000, agent_spend_monthly: 150000, notes: "Post-seed, pre-Series A",
};

export const seedInvestors: InvestorRecord[] = [
  { investor_id: "inv-001", name: "Sophie Laurent", firm: "Deep Tech Ventures", contact_email: "sophie@deeptechvc.com", stage: "meeting", last_contact: daysAgo(7), notes: "Interested in our unit economics", next_action: "Send data room access", assigned_agent_id: "cfo-agent" },
  { investor_id: "inv-002", name: "Mark Thompson", firm: "Infra Capital", contact_email: "mark@infracap.vc", stage: "warm", last_contact: daysAgo(14), notes: "Intro from GTC event", next_action: "Schedule initial call", assigned_agent_id: "cfo-agent" },
  { investor_id: "inv-003", name: "Yuki Tanaka", firm: "Asia GPU Fund", contact_email: "yuki@asiagpu.fund", stage: "due_diligence", last_contact: daysAgo(3), notes: "Reviewing India DC pilot data", next_action: "Technical deep-dive session", assigned_agent_id: "cfo-agent" },
];

export const seedHiring: HiringRecord[] = [
  { role_id: "role-001", title: "Senior GPU Engineer", department: "Engineering", status: "interviewing", priority: "high", description: "CUDA/NVML optimization specialist", candidates_count: 4, opened_at: daysAgo(30), filled_at: null },
  { role_id: "role-002", title: "Solutions Engineer", department: "Sales", status: "open", priority: "medium", description: "Customer-facing technical implementation", candidates_count: 0, opened_at: daysAgo(14), filled_at: null },
];

// ── Reports ──────────────────────────────────────────

export const seedReports: Report[] = [
  { report_id: "rpt-001", title: "Weekly Leadership Summary", description: "KPIs, pipeline, customer health", report_type: "leadership", status: "ready", format: "markdown", generated_by: "report-agent", generated_at: daysAgo(1), summary: "MRR up 8% WoW. 1 at-risk customer (Neural Bridge). 2 renewals in pipeline.", customer_id: null, period_start: daysAgo(7), period_end: now, created_at: daysAgo(1) },
  { report_id: "rpt-002", title: "Customer Health Report — March 2026", description: "Health scores and engagement for all active customers", report_type: "customer_health", status: "ready", format: "html", generated_by: "report-agent", generated_at: daysAgo(3), summary: "4 healthy, 2 warning, 2 at-risk. Average health score: 60.5.", customer_id: null, period_start: daysAgo(30), period_end: now, created_at: daysAgo(3) },
  { report_id: "rpt-003", title: "Support SLA Compliance — W13", description: "Ticket resolution and response times", report_type: "support_sla", status: "ready", format: "json", generated_by: "report-agent", generated_at: daysAgo(2), summary: "92% SLA compliance. 1 breach (PFX-1001). Avg resolution: 4.2h.", customer_id: null, period_start: daysAgo(7), period_end: now, created_at: daysAgo(2) },
  { report_id: "rpt-004", title: "Board/Investor Update — March 2026", description: null, report_type: "board_investor", status: "generating", format: "pdf", generated_by: "report-agent", generated_at: null, summary: null, customer_id: null, period_start: daysAgo(30), period_end: now, created_at: daysAgo(0) },
];

export const seedReportStats = {
  total: 4, by_type: { leadership: 1, customer_health: 1, support_sla: 1, board_investor: 1 },
  by_status: { ready: 3, generating: 1, pending: 0, failed: 0 },
};

export const seedSchedules: ReportSchedule[] = [
  { schedule_id: "sch-001", report_type: "leadership", title: "Weekly Leadership Summary", frequency: "weekly", next_run_at: daysAgo(-4), last_run_at: daysAgo(3), enabled: true, created_by: "report-agent" },
  { schedule_id: "sch-002", report_type: "customer_health", title: "Monthly Customer Health", frequency: "monthly", next_run_at: daysAgo(-25), last_run_at: daysAgo(5), enabled: true, created_by: "report-agent" },
  { schedule_id: "sch-003", report_type: "support_sla", title: "Weekly SLA Report", frequency: "weekly", next_run_at: daysAgo(-5), last_run_at: daysAgo(2), enabled: true, created_by: "report-agent" },
];

// ── Playbooks ────────────────────────────────────────

export const seedPlaybooks: Playbook[] = [
  { playbook_id: "pb-001", name: "New Customer Onboarding", description: "8-step onboarding from contract signing to go-live", playbook_type: "onboarding", status: "active", version: 3, trigger_type: "event", trigger_config: '{"event":"customer_created"}', steps: '[{"order":1,"name":"Contract signed"},{"order":2,"name":"API keys provisioned"},{"order":3,"name":"Agent deployed"},{"order":4,"name":"Baseline recorded"},{"order":5,"name":"Dry-run cycle"},{"order":6,"name":"Dashboard configured"},{"order":7,"name":"Training session"},{"order":8,"name":"Go-live"}]', created_by: "playbook-agent", created_at: daysAgo(180), updated_at: daysAgo(30) },
  { playbook_id: "pb-002", name: "At-Risk Customer Recovery", description: "Triggered when health score drops below 40", playbook_type: "at_risk", status: "active", version: 2, trigger_type: "condition", trigger_config: '{"condition":"health_score < 40"}', steps: '[{"order":1,"name":"Alert success agent"},{"order":2,"name":"Schedule emergency call"},{"order":3,"name":"Generate health report"},{"order":4,"name":"Create action plan"},{"order":5,"name":"Executive escalation if needed"}]', created_by: "playbook-agent", created_at: daysAgo(120), updated_at: daysAgo(14) },
  { playbook_id: "pb-003", name: "Critical Incident Response", description: "Immediate response for critical severity tickets", playbook_type: "critical_incident", status: "active", version: 1, trigger_type: "event", trigger_config: '{"event":"ticket_created","severity":"critical"}', steps: '[{"order":1,"name":"Page on-call"},{"order":2,"name":"Create incident channel"},{"order":3,"name":"Notify customer"},{"order":4,"name":"Root cause analysis"},{"order":5,"name":"Resolution + postmortem"}]', created_by: "playbook-agent", created_at: daysAgo(90), updated_at: daysAgo(45) },
  { playbook_id: "pb-004", name: "Renewal Process", description: "90-day renewal workflow", playbook_type: "renewal", status: "active", version: 2, trigger_type: "schedule", trigger_config: '{"days_before_expiry":90}', steps: '[{"order":1,"name":"Health check"},{"order":2,"name":"Usage report"},{"order":3,"name":"Renewal proposal"},{"order":4,"name":"Negotiation"},{"order":5,"name":"Contract signing"}]', created_by: "playbook-agent", created_at: daysAgo(150), updated_at: daysAgo(20) },
  { playbook_id: "pb-005", name: "Pilot to Paid Conversion", description: "Convert trial customers to paying contracts", playbook_type: "pilot_to_paid", status: "active", version: 1, trigger_type: "condition", trigger_config: '{"condition":"status == pilot && days_remaining < 14"}', steps: '[{"order":1,"name":"ROI report"},{"order":2,"name":"Decision maker meeting"},{"order":3,"name":"Proposal"},{"order":4,"name":"Contract"}]', created_by: "playbook-agent", created_at: daysAgo(60), updated_at: daysAgo(10) },
  { playbook_id: "pb-006", name: "Ticket Storm Response", description: "Multiple tickets from same customer in short period", playbook_type: "ticket_storm", status: "paused", version: 1, trigger_type: "condition", trigger_config: '{"condition":"tickets_24h > 3"}', steps: '[{"order":1,"name":"Aggregate tickets"},{"order":2,"name":"Root cause triage"},{"order":3,"name":"Customer communication"},{"order":4,"name":"Resolution plan"}]', created_by: "playbook-agent", created_at: daysAgo(45), updated_at: daysAgo(5) },
];

export const seedPlaybookStats = {
  total: 6, active: 5, paused: 1, total_runs: 23, success_rate: 87,
};

export const seedPlaybookRuns: PlaybookRun[] = [
  { run_id: "run-001", playbook_id: "pb-001", customer_id: "cust-004", ticket_id: null, trigger_event: "customer_created", status: "running", current_step: 6, started_at: daysAgo(40), completed_at: null, started_by: "playbook-agent", error_message: null, created_at: daysAgo(40) },
  { run_id: "run-002", playbook_id: "pb-002", customer_id: "cust-005", ticket_id: null, trigger_event: "health_score_drop", status: "running", current_step: 3, started_at: daysAgo(5), completed_at: null, started_by: "playbook-agent", error_message: null, created_at: daysAgo(5) },
  { run_id: "run-003", playbook_id: "pb-003", customer_id: "cust-003", ticket_id: "tkt-003", trigger_event: "critical_ticket", status: "running", current_step: 2, started_at: daysAgo(0), completed_at: null, started_by: "playbook-agent", error_message: null, created_at: daysAgo(0) },
  { run_id: "run-004", playbook_id: "pb-004", customer_id: "cust-006", ticket_id: null, trigger_event: "renewal_90d", status: "running", current_step: 3, started_at: daysAgo(25), completed_at: null, started_by: "billing-agent", error_message: null, created_at: daysAgo(25) },
  { run_id: "run-005", playbook_id: "pb-001", customer_id: "cust-002", ticket_id: null, trigger_event: "customer_created", status: "completed", current_step: 8, started_at: daysAgo(90), completed_at: daysAgo(45), started_by: "playbook-agent", error_message: null, created_at: daysAgo(90) },
];

export const seedActiveRuns: PlaybookRun[] = seedPlaybookRuns.filter((r) => r.status === "running");
