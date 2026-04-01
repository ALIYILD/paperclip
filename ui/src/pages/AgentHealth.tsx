import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { observabilityApi } from "../api/observability";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { PageSkeleton } from "../components/PageSkeleton";
import { EmptyState } from "../components/EmptyState";
import { timeAgo } from "../lib/timeAgo";
import { Activity } from "lucide-react";
import type { AgentHealthEntry } from "../api/observability";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  idle: "bg-yellow-500",
  paused: "bg-gray-400",
  error: "bg-red-500",
  offline: "bg-gray-400",
};

function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? "bg-gray-400";
}

function AgentCard({ agent }: { agent: AgentHealthEntry }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${statusColor(agent.currentStatus)}`}
          title={agent.currentStatus}
        />
        <h3 className="text-sm font-medium truncate">{agent.agentName}</h3>
        <span className="ml-auto text-xs text-muted-foreground capitalize">
          {agent.currentStatus}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-semibold tabular-nums">
            {agent.successRate != null ? `${agent.successRate}%` : "\u2014"}
          </p>
          <p className="text-xs text-muted-foreground">Success rate</p>
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums">
            {agent.runsLast24h}
          </p>
          <p className="text-xs text-muted-foreground">Runs (24h)</p>
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums">
            {agent.lastRunTime ? timeAgo(agent.lastRunTime) : "\u2014"}
          </p>
          <p className="text-xs text-muted-foreground">Last run</p>
        </div>
      </div>
    </div>
  );
}

export function AgentHealth() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "Agent Health" }]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ["observability", "agent-health", selectedCompanyId],
    queryFn: () => observabilityApi.agentHealth(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 30_000,
  });

  if (isLoading) return <PageSkeleton />;

  const agents = data?.agents ?? [];

  if (agents.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        message="No agents found for this company yet."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Agent Health</h1>
        <span className="text-sm text-muted-foreground">
          {agents.length} agent{agents.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.agentId} agent={agent} />
        ))}
      </div>
    </div>
  );
}
