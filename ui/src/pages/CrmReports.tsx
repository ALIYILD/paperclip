import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi, type Report, type ReportSchedule } from "../api/crm";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusBadge } from "../components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Clock, FileText, Play } from "lucide-react";

type Tab = "reports" | "schedules";

export function CrmReports() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [tab, setTab] = useState<Tab>("reports");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    setBreadcrumbs([{ label: "Reports" }]);
  }, [setBreadcrumbs]);

  const filterKey = typeFilter || undefined;

  const { data: stats } = useQuery({
    queryKey: queryKeys.crm.reports.stats,
    queryFn: () => reportsApi.stats(),
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: queryKeys.crm.reports.list(filterKey),
    queryFn: () => reportsApi.list({ report_type: filterKey }),
  });

  const { data: schedules } = useQuery({
    queryKey: queryKeys.crm.reports.schedules,
    queryFn: () => reportsApi.listSchedules(),
    enabled: tab === "schedules",
  });

  if (isLoading) {
    return <PageSkeleton variant="list" />;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "reports", label: "Reports" },
    { key: "schedules", label: "Schedules" },
  ];

  const reportTypes = [
    "leadership", "customer_health", "support_sla",
    "sales_pipeline", "finance_runway", "board_investor", "custom",
  ];

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <FileText className="h-3.5 w-3.5" /> Total Reports
              </div>
              <p className="text-2xl font-bold tabular-nums">{(stats as any).total ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BarChart3 className="h-3.5 w-3.5" /> Ready
              </div>
              <p className="text-2xl font-bold tabular-nums text-green-400">
                {(stats as any).by_status?.ready ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" /> Pending
              </div>
              <p className="text-2xl font-bold tabular-nums text-amber-400">
                {(stats as any).by_status?.pending ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Play className="h-3.5 w-3.5" /> Generating
              </div>
              <p className="text-2xl font-bold tabular-nums text-blue-400">
                {(stats as any).by_status?.generating ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reports" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            >
              <option value="">All Types</option>
              {reportTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {!reports || reports.length === 0 ? (
            <EmptyState icon={BarChart3} message="No reports generated yet." />
          ) : (
            <div className="border border-border divide-y divide-border">
              {reports.map((r: Report) => (
                <div key={r.report_id} className="px-4 py-3 text-sm hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.report_type?.replace(/_/g, " ")} &middot; {r.format}
                        {r.generated_at && ` \u00b7 ${new Date(r.generated_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  {r.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.summary}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "schedules" && (
        <div className="space-y-4">
          {!schedules || schedules.length === 0 ? (
            <EmptyState icon={Clock} message="No report schedules configured." />
          ) : (
            <div className="border border-border divide-y divide-border">
              {(schedules as ReportSchedule[]).map((s) => (
                <div key={s.schedule_id} className="px-4 py-3 text-sm hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.report_type?.replace(/_/g, " ")} &middot; {s.frequency}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs ${s.enabled ? "text-green-400" : "text-muted-foreground"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.enabled ? "bg-green-400" : "bg-muted-foreground"}`} />
                        {s.enabled ? "Enabled" : "Disabled"}
                      </span>
                      {s.next_run_at && (
                        <span className="text-xs text-muted-foreground">
                          Next: {new Date(s.next_run_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
