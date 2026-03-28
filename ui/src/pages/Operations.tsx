import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  operationsApi,
  KPI,
  OKR,
  FinancialSnapshot,
  InvestorRecord,
  HiringRecord,
} from "../api/crm";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusBadge } from "../components/StatusBadge";
import { formatCents } from "../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  BarChart3,
  Banknote,
  Users,
  Briefcase,
} from "lucide-react";

type Tab = "kpis" | "okrs" | "financials" | "investors" | "hiring";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "kpis", label: "KPIs", icon: BarChart3 },
  { key: "okrs", label: "OKRs", icon: Building2 },
  { key: "financials", label: "Financials", icon: Banknote },
  { key: "investors", label: "Investors", icon: Users },
  { key: "hiring", label: "Hiring", icon: Briefcase },
];

function trendArrow(trend: string) {
  if (trend === "up") return <span className="text-green-500">&#9650;</span>;
  if (trend === "down") return <span className="text-red-500">&#9660;</span>;
  return <span className="text-muted-foreground">&#9654;</span>;
}

export function Operations() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [tab, setTab] = useState<Tab>("kpis");

  useEffect(() => {
    setBreadcrumbs([{ label: "Operations" }]);
  }, [setBreadcrumbs]);

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: queryKeys.crm.operations.kpis(),
    queryFn: () => operationsApi.listKpis(),
  });

  const { data: okrs, isLoading: okrsLoading } = useQuery({
    queryKey: queryKeys.crm.operations.okrs(),
    queryFn: () => operationsApi.listOkrs(),
  });

  const { data: financials, isLoading: financialsLoading } = useQuery({
    queryKey: queryKeys.crm.operations.financials,
    queryFn: () => operationsApi.latestFinancials(),
  });

  const { data: investors, isLoading: investorsLoading } = useQuery({
    queryKey: queryKeys.crm.operations.investors(),
    queryFn: () => operationsApi.listInvestors(),
  });

  const { data: hiring, isLoading: hiringLoading } = useQuery({
    queryKey: queryKeys.crm.operations.hiring(),
    queryFn: () => operationsApi.listRoles(),
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={() => setTab(key)}
            className={
              tab === key
                ? "border-b-2 border-foreground rounded-none"
                : "rounded-none text-muted-foreground"
            }
          >
            <Icon className="h-4 w-4 mr-1.5" />
            {label}
          </Button>
        ))}
      </div>

      {/* KPIs tab */}
      {tab === "kpis" && (
        <>
          {kpisLoading ? (
            <PageSkeleton variant="list" />
          ) : !kpis?.length ? (
            <EmptyState icon={BarChart3} message="No KPIs defined yet." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="p-3">Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Current</th>
                      <th className="p-3 text-right">Target</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3 text-center">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.map((k: KPI) => (
                      <tr key={k.kpi_id} className="border-b border-border last:border-0">
                        <td className="p-3 font-medium">{k.name}</td>
                        <td className="p-3">
                          <StatusBadge status={k.category} />
                        </td>
                        <td className="p-3 text-right tabular-nums">{k.current_value}</td>
                        <td className="p-3 text-right tabular-nums">{k.target_value}</td>
                        <td className="p-3 text-muted-foreground">{k.unit}</td>
                        <td className="p-3 text-center">{trendArrow(k.trend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* OKRs tab */}
      {tab === "okrs" && (
        <>
          {okrsLoading ? (
            <PageSkeleton variant="list" />
          ) : !okrs?.length ? (
            <EmptyState icon={Building2} message="No OKRs defined yet." />
          ) : (
            <div className="space-y-4">
              {okrs.map((o: OKR) => (
                <Card key={o.okr_id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{o.title}</p>
                        <p className="text-xs text-muted-foreground">{o.quarter}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={o.status} />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className="tabular-nums">{o.progress_pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-[width] duration-150"
                          style={{ width: `${Math.min(100, o.progress_pct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Key Results */}
                    {o.key_results?.length > 0 && (
                      <div className="space-y-1 pl-3 border-l-2 border-border">
                        {o.key_results.map((kr) => (
                          <div
                            key={kr.kr_id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="truncate text-muted-foreground">
                              {kr.description}
                            </span>
                            <span className="tabular-nums shrink-0 ml-2">
                              {kr.current_value} / {kr.target_value} {kr.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Financials tab */}
      {tab === "financials" && (
        <>
          {financialsLoading ? (
            <PageSkeleton variant="list" />
          ) : !financials ? (
            <EmptyState icon={Banknote} message="No financial data yet." />
          ) : (
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">MRR</p>
                  <p className="text-xl font-bold tabular-nums mt-1">
                    {formatCents(financials.mrr)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">ARR</p>
                  <p className="text-xl font-bold tabular-nums mt-1">
                    {formatCents(financials.arr)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Burn Rate (Monthly)</p>
                  <p className="text-xl font-bold tabular-nums mt-1">
                    {formatCents(financials.burn_rate_monthly)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Runway</p>
                  <p className="text-xl font-bold tabular-nums mt-1">
                    {financials.runway_months}{" "}
                    <span className="text-base font-normal text-muted-foreground">months</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Cash Balance</p>
                  <p className="text-xl font-bold tabular-nums mt-1">
                    {formatCents(financials.cash_balance)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Revenue Pipeline</p>
                  <p className="text-xl font-bold tabular-nums mt-1">
                    {formatCents(financials.revenue_pipeline_value)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Investors tab */}
      {tab === "investors" && (
        <>
          {investorsLoading ? (
            <PageSkeleton variant="list" />
          ) : !investors?.length ? (
            <EmptyState icon={Users} message="No investor records yet." />
          ) : (
            <div className="space-y-2">
              {investors.map((inv: InvestorRecord) => (
                <Card key={inv.investor_id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.firm}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={inv.stage} />
                      {inv.last_contact && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Last contact {new Date(inv.last_contact).toLocaleDateString()}
                        </span>
                      )}
                      {inv.next_action && (
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          Next: {inv.next_action}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Hiring tab */}
      {tab === "hiring" && (
        <>
          {hiringLoading ? (
            <PageSkeleton variant="list" />
          ) : !hiring?.length ? (
            <EmptyState icon={Briefcase} message="No open roles yet." />
          ) : (
            <div className="space-y-2">
              {hiring.map((h: HiringRecord) => (
                <Card key={h.role_id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{h.title}</p>
                      <p className="text-xs text-muted-foreground">{h.department}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={h.status} />
                      <StatusBadge status={h.priority} />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {h.candidates_count} candidate{h.candidates_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
