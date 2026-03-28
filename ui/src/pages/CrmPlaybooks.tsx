import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { playbooksApi, type Playbook, type PlaybookRun } from "../api/crm";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusBadge } from "../components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Layers, Activity, CheckCircle } from "lucide-react";

type Tab = "playbooks" | "active" | "runs";

export function CrmPlaybooks() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [tab, setTab] = useState<Tab>("playbooks");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    setBreadcrumbs([{ label: "Playbooks" }]);
  }, [setBreadcrumbs]);

  const { data: stats } = useQuery({
    queryKey: queryKeys.crm.playbooks.stats,
    queryFn: () => playbooksApi.stats(),
  });

  const { data: playbooks, isLoading } = useQuery({
    queryKey: queryKeys.crm.playbooks.list(typeFilter || undefined),
    queryFn: () => playbooksApi.list({ playbook_type: typeFilter || undefined }),
  });

  const { data: activeRuns } = useQuery({
    queryKey: queryKeys.crm.playbooks.activeRuns,
    queryFn: () => playbooksApi.activeRuns(),
    enabled: tab === "active",
    refetchInterval: 10_000,
  });

  const { data: allRuns } = useQuery({
    queryKey: queryKeys.crm.playbooks.runs(),
    queryFn: () => playbooksApi.listRuns({ limit: 50 }),
    enabled: tab === "runs",
  });

  if (isLoading) {
    return <PageSkeleton variant="list" />;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "playbooks", label: "Playbooks" },
    { key: "active", label: `Active Runs${activeRuns?.length ? ` (${activeRuns.length})` : ""}` },
    { key: "runs", label: "All Runs" },
  ];

  const playbookTypes = [
    "onboarding", "at_risk", "critical_incident",
    "renewal", "pilot_to_paid", "ticket_storm", "custom",
  ];

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Layers className="h-3.5 w-3.5" /> Total Playbooks
              </div>
              <p className="text-2xl font-bold tabular-nums">{(stats as any).total ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Play className="h-3.5 w-3.5" /> Active
              </div>
              <p className="text-2xl font-bold tabular-nums text-green-400">
                {(stats as any).active ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Activity className="h-3.5 w-3.5" /> Total Runs
              </div>
              <p className="text-2xl font-bold tabular-nums">{(stats as any).total_runs ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <CheckCircle className="h-3.5 w-3.5" /> Success Rate
              </div>
              <p className="text-2xl font-bold tabular-nums text-green-400">
                {(stats as any).success_rate != null ? `${Math.round((stats as any).success_rate)}%` : "—"}
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

      {tab === "playbooks" && (
        <div className="space-y-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
          >
            <option value="">All Types</option>
            {playbookTypes.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>

          {!playbooks || playbooks.length === 0 ? (
            <EmptyState icon={Layers} message="No playbooks defined yet." />
          ) : (
            <div className="border border-border divide-y divide-border">
              {playbooks.map((p: Playbook) => {
                let stepCount = 0;
                try {
                  const parsed = typeof p.steps === "string" ? JSON.parse(p.steps) : p.steps;
                  stepCount = Array.isArray(parsed) ? parsed.length : 0;
                } catch { /* empty */ }

                return (
                  <div key={p.playbook_id} className="px-4 py-3 text-sm hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.playbook_type?.replace(/_/g, " ")} &middot; {p.trigger_type}
                          {stepCount > 0 && ` \u00b7 ${stepCount} steps`}
                          {` \u00b7 v${p.version}`}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "active" && (
        <div className="space-y-4">
          {!activeRuns || activeRuns.length === 0 ? (
            <EmptyState icon={Activity} message="No active playbook runs." />
          ) : (
            <div className="border border-border divide-y divide-border">
              {activeRuns.map((r: PlaybookRun) => (
                <RunRow key={r.run_id} run={r} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "runs" && (
        <div className="space-y-4">
          {!allRuns || allRuns.length === 0 ? (
            <EmptyState icon={Layers} message="No playbook runs yet." />
          ) : (
            <div className="border border-border divide-y divide-border">
              {allRuns.map((r: PlaybookRun) => (
                <RunRow key={r.run_id} run={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunRow({ run }: { run: PlaybookRun }) {
  return (
    <div className="px-4 py-3 text-sm hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">
            Run <span className="font-mono text-muted-foreground">{run.run_id.slice(0, 8)}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Playbook: {run.playbook_id.slice(0, 8)}
            {run.customer_id && ` \u00b7 Customer: ${run.customer_id.slice(0, 8)}`}
            {run.trigger_event && ` \u00b7 Trigger: ${run.trigger_event}`}
            {` \u00b7 Step ${run.current_step}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={run.status} />
          {run.started_at && (
            <span className="text-xs text-muted-foreground">
              {new Date(run.started_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      {run.error_message && (
        <p className="text-xs text-red-400 mt-1">{run.error_message}</p>
      )}
    </div>
  );
}
