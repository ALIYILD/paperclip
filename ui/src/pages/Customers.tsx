import { useEffect, useState, useMemo } from "react";
import { Link } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { customersApi } from "../api/crm";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusBadge } from "../components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, AlertTriangle, Heart, Shield } from "lucide-react";
import type { Customer, HealthSummary } from "../api/crm";

export function Customers() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [statusFilter, setStatusFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");

  useEffect(() => {
    setBreadcrumbs([{ label: "Customers" }]);
  }, [setBreadcrumbs]);

  const filterKey = useMemo(() => {
    const parts: string[] = [];
    if (statusFilter) parts.push(`status=${statusFilter}`);
    if (tierFilter) parts.push(`tier=${tierFilter}`);
    return parts.join("&") || undefined;
  }, [statusFilter, tierFilter]);

  const {
    data: customers,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.crm.customers.list(filterKey),
    queryFn: () =>
      customersApi.list({
        status: statusFilter || undefined,
        tier: tierFilter || undefined,
      }),
  });

  const { data: healthSummary } = useQuery({
    queryKey: queryKeys.crm.customers.healthSummary,
    queryFn: () => customersApi.healthSummary(),
  });

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  function healthColor(score: number): string {
    if (score < 40) return "text-red-400";
    if (score <= 70) return "text-yellow-400";
    return "text-green-400";
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Card className="border-border">
          <MetricCard
            icon={Users}
            value={healthSummary?.total_customers ?? 0}
            label="Total Customers"
          />
        </Card>
        <Card className="border-border">
          <MetricCard
            icon={AlertTriangle}
            value={healthSummary?.at_risk ?? 0}
            label="At Risk"
          />
        </Card>
        <Card className="border-border">
          <MetricCard
            icon={Heart}
            value={healthSummary?.avg_health_score != null ? Math.round(healthSummary.avg_health_score) : "--"}
            label="Avg Health Score"
          />
        </Card>
        <Card className="border-border">
          <MetricCard
            icon={Shield}
            value={healthSummary?.healthy ?? 0}
            label="Healthy"
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
          <option value="prospect">Prospect</option>
          <option value="pilot">Pilot</option>
          <option value="active">Active</option>
          <option value="churned">Churned</option>
          <option value="paused">Paused</option>
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Tiers</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
          <option value="pilot">Pilot</option>
        </select>
      </div>

      {/* Customer list */}
      {customers && customers.length === 0 && (
        <EmptyState icon={Users} message="No customers match the current filters." />
      )}

      {customers && customers.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {customers.map((customer) => (
                <Link
                  key={customer.customer_id}
                  to={`/customers/${customer.customer_id}`}
                  className="flex items-center gap-4 px-4 py-3 text-sm no-underline text-inherit hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{customer.company_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{customer.contact_name}</p>
                  </div>

                  <StatusBadge status={customer.status} />

                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap bg-zinc-800 text-zinc-300">
                    {customer.tier}
                  </span>

                  <span className={`text-sm font-semibold tabular-nums w-10 text-right ${healthColor(customer.health_score)}`}>
                    {customer.health_score}
                  </span>

                  <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                    {customer.fleet_size} GPUs
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
