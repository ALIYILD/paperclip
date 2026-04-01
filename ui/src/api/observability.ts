import { api } from "./client";

export interface AgentHealthEntry {
  agentId: string;
  agentName: string;
  currentStatus: string;
  lastRunTime: string | null;
  runsLast24h: number;
  successRate: number | null;
}

interface AgentHealthResponse {
  agents: AgentHealthEntry[];
}

export const observabilityApi = {
  agentHealth: (companyId: string) =>
    api.get<AgentHealthResponse>(`/companies/${companyId}/observability/agent-health`),
};
