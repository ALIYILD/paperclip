import { useEffect, useState } from "react";
import { useParams } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { customersApi, successApi } from "../api/crm";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { StatusBadge } from "../components/StatusBadge";
import { PageSkeleton } from "../components/PageSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Users, Activity, ClipboardList, BarChart3 } from "lucide-react";
import type { Customer, HealthBreakdown, Interaction, OnboardingProgress } from "../api/crm";

type Tab = "overview" | "onboarding" | "interactions" | "success";

export function CustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const {
    data: customer,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.crm.customers.detail(customerId!),
    queryFn: () => customersApi.get(customerId!),
    enabled: !!customerId,
  });

  const { data: health } = useQuery({
    queryKey: queryKeys.crm.customers.health(customerId!),
    queryFn: () => customersApi.getHealth(customerId!),
    enabled: !!customerId && activeTab === "overview",
  });

  const { data: onboarding } = useQuery({
    queryKey: queryKeys.crm.customers.onboarding(customerId!),
    queryFn: () => customersApi.getOnboarding(customerId!),
    enabled: !!customerId && activeTab === "onboarding",
  });

  const { data: interactions } = useQuery({
    queryKey: queryKeys.crm.customers.interactions(customerId!),
    queryFn: () => customersApi.listInteractions(customerId!),
    enabled: !!customerId && activeTab === "interactions",
  });

  const { data: stakeholders } = useQuery({
    queryKey: queryKeys.crm.success.stakeholders(customerId!),
    queryFn: () => successApi.stakeholders(customerId!),
    enabled: !!customerId && activeTab === "success",
  });

  const { data: adoption } = useQuery({
    queryKey: queryKeys.crm.success.adoption(customerId!),
    queryFn: () => successApi.adoption(customerId!),
    enabled: !!customerId && activeTab === "success",
  });

  const { data: scores } = useQuery({
    queryKey: queryKeys.crm.success.scores(customerId!),
    queryFn: () => successApi.scores(customerId!),
    enabled: !!customerId && activeTab === "success",
  });

  useEffect(() => {
    if (customer) {
      setBreadcrumbs([
        { label: "Customers", to: "/customers" },
        { label: customer.company_name },
      ]);
    } else {
      setBreadcrumbs([
        { label: "Customers", to: "/customers" },
        { label: "..." },
      ]);
    }
  }, [setBreadcrumbs, customer]);

  if (isLoading) {
    return <PageSkeleton variant="detail" />;
  }

  if (error) {
    return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  }

  if (!customer) {
    return <p className="text-sm text-muted-foreground">Customer not found.</p>;
  }

  function healthColor(score: number): string {
    if (score < 40) return "text-red-400";
    if (score <= 70) return "text-yellow-400";
    return "text-green-400";
  }

  function healthBg(score: number): string {
    if (score < 40) return "bg-red-400";
    if (score <= 70) return "bg-yellow-400";
    return "bg-green-400";
  }

  function sentimentColor(sentiment: string): string {
    switch (sentiment) {
      case "positive":
        return "text-green-400";
      case "negative":
        return "text-red-400";
      case "neutral":
      default:
        return "text-zinc-400";
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "onboarding", label: "Onboarding" },
    { key: "interactions", label: "Interactions" },
    { key: "success", label: "Success" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{customer.company_name}</h1>
          <StatusBadge status={customer.status} />
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap bg-zinc-800 text-zinc-300">
            {customer.tier}
          </span>
          <span className={`text-lg font-bold tabular-nums ${healthColor(customer.health_score)}`}>
            {customer.health_score}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {customer.contact_name}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {customer.contact_email}
          </span>
          <span className="text-xs tabular-nums">Fleet: {customer.fleet_size} GPUs</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              { label: "Usage", score: health?.usage_score },
              { label: "Support", score: health?.support_score },
              { label: "Engagement", score: health?.engagement_score },
              { label: "Financial", score: health?.financial_score },
            ] as const
          ).map((item) => (
            <Card key={item.label} className="border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">{item.label}</p>
                <p className={`text-2xl font-semibold tabular-nums ${healthColor(item.score ?? 0)}`}>
                  {item.score != null ? item.score : "--"}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all ${healthBg(item.score ?? 0)}`}
                    style={{ width: `${Math.min(item.score ?? 0, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "onboarding" && (
        <div className="space-y-4">
          {onboarding && (
            <>
              {/* Progress bar */}
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Onboarding Progress</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {Math.round(onboarding.progress_pct)}%
                    </p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${onboarding.progress_pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {onboarding.completed} of {onboarding.total} steps completed
                  </p>
                </CardContent>
              </Card>

              {/* Steps */}
              <Card className="border-border">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {onboarding.steps.map((step) => (
                      <div
                        key={step.step_name}
                        className="flex items-center justify-between px-4 py-3 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{step.step_name}</p>
                          {step.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {step.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {step.due_date && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              Due {new Date(step.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <StatusBadge status={step.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === "interactions" && (
        <div className="space-y-3">
          {interactions && interactions.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No interactions recorded yet.
            </p>
          )}

          {interactions &&
            interactions.map((interaction) => (
              <Card key={interaction.interaction_id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={interaction.interaction_type} />
                        <span
                          className={`text-xs font-medium ${sentimentColor(interaction.sentiment)}`}
                        >
                          {interaction.sentiment}
                        </span>
                      </div>
                      <p className="text-sm">{interaction.summary}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                      {new Date(interaction.timestamp).toLocaleDateString()}{" "}
                      {new Date(interaction.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {activeTab === "success" && (
        <div className="space-y-6">
          {/* Stakeholders */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Stakeholders</h3>
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {stakeholders && (stakeholders as Record<string, unknown>[]).length > 0 ? (
                    (stakeholders as Record<string, unknown>[]).map(
                      (s: Record<string, unknown>, i: number) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium">{String(s.name ?? s.contact_name ?? "--")}</p>
                            <p className="text-xs text-muted-foreground">
                              {String(s.role ?? s.title ?? "")}
                            </p>
                          </div>
                          {s.influence && (
                            <span className="text-xs text-muted-foreground">{String(s.influence)}</span>
                          )}
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground px-4 py-6 text-center">
                      No stakeholders recorded.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Adoption */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Adoption Metrics</h3>
            <Card className="border-border">
              <CardContent className="p-4">
                {adoption && (adoption as Record<string, unknown>[]).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {(adoption as Record<string, unknown>[]).map(
                      (m: Record<string, unknown>, i: number) => (
                        <div key={i}>
                          <p className="text-xs text-muted-foreground">
                            {String(m.metric ?? m.name ?? `Metric ${i + 1}`)}
                          </p>
                          <p className="text-lg font-semibold tabular-nums">
                            {String(m.value ?? m.current_value ?? "--")}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No adoption data available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Scores */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Scores</h3>
            <Card className="border-border">
              <CardContent className="p-4">
                {scores && Object.keys(scores).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {Object.entries(scores).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs text-muted-foreground">{key.replace(/_/g, " ")}</p>
                        <p className="text-lg font-semibold tabular-nums">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No scores available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
