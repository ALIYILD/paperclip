import { useEffect, useState, useMemo } from "react";
import { Link } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { ticketsApi } from "../api/crm";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusBadge } from "../components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { TicketCheck, AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { timeAgo } from "../lib/timeAgo";
import type { Ticket, TicketSummary } from "../api/crm";

const severityColor: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

export function CrmTickets() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    setBreadcrumbs([{ label: "Tickets" }]);
  }, [setBreadcrumbs]);

  const filterKey = useMemo(() => {
    const parts: string[] = [];
    if (statusFilter) parts.push(`status=${statusFilter}`);
    if (severityFilter) parts.push(`severity=${severityFilter}`);
    if (categoryFilter) parts.push(`category=${categoryFilter}`);
    return parts.join("&") || undefined;
  }, [statusFilter, severityFilter, categoryFilter]);

  const {
    data: tickets,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.crm.tickets.list(filterKey),
    queryFn: () =>
      ticketsApi.list({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        category: categoryFilter || undefined,
      }),
  });

  const { data: summary } = useQuery({
    queryKey: queryKeys.crm.tickets.summary,
    queryFn: () => ticketsApi.summary(),
  });

  // Derive unique categories from the loaded tickets for the filter dropdown
  const categories = useMemo(() => {
    if (!tickets) return [];
    const set = new Set(tickets.map((t) => t.category).filter(Boolean));
    return Array.from(set).sort();
  }, [tickets]);

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Card className="border-border">
          <MetricCard
            icon={TicketCheck}
            value={summary?.open ?? 0}
            label="Open Tickets"
          />
        </Card>
        <Card className="border-border">
          <MetricCard
            icon={Clock}
            value={summary?.in_progress ?? 0}
            label="In Progress"
          />
        </Card>
        <Card className="border-border">
          <MetricCard
            icon={AlertCircle}
            value={summary?.by_severity?.critical ?? 0}
            label="Critical Severity"
          />
        </Card>
        <Card className="border-border">
          <MetricCard
            icon={ShieldAlert}
            value={summary?.sla_breached ?? 0}
            label="SLA Breached"
          />
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="triaged">Triaged</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_customer">Waiting Customer</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Ticket list */}
      {tickets && tickets.length === 0 && (
        <EmptyState icon={TicketCheck} message="No tickets match the current filters." />
      )}

      {tickets && tickets.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.ticket_id}
                  to={`/tickets/${ticket.ticket_id}`}
                  className="flex items-center gap-4 px-4 py-3 text-sm no-underline text-inherit hover:bg-accent/50 transition-colors"
                >
                  <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">
                    {ticket.ticket_number ?? ticket.ticket_id.slice(0, 8)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ticket.title}</p>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                      severityColor[ticket.severity] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {ticket.severity}
                  </span>

                  <StatusBadge status={ticket.status} />

                  <span className="text-xs text-muted-foreground whitespace-nowrap w-24 text-right truncate">
                    {ticket.category.replace(/_/g, " ")}
                  </span>

                  <span className="text-xs text-muted-foreground whitespace-nowrap w-24 text-right truncate">
                    {ticket.assigned_team}
                  </span>

                  <span className="text-xs text-muted-foreground tabular-nums w-16 text-right shrink-0">
                    {ticket.created_at ? timeAgo(ticket.created_at) : "--"}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
