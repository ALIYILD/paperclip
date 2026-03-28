import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketingApi, Lead, Campaign } from "../api/crm";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusBadge } from "../components/StatusBadge";
import { formatCents } from "../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Megaphone } from "lucide-react";

type Tab = "leads" | "campaigns";

const LEAD_STATUSES = ["all", "new", "contacted", "qualified", "nurturing", "converted", "lost"] as const;
const LEAD_SOURCES = ["all", "website", "referral", "outbound", "event", "partner"] as const;

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  if (score >= 25) return "text-orange-500";
  return "text-red-500";
}

export function Pipeline() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [tab, setTab] = useState<Tab>("leads");
  const [leadStatus, setLeadStatus] = useState("all");
  const [leadSource, setLeadSource] = useState("all");
  const [campaignStatus, setCampaignStatus] = useState("all");

  useEffect(() => {
    setBreadcrumbs([{ label: "Pipeline" }]);
  }, [setBreadcrumbs]);

  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: queryKeys.crm.marketing.pipeline,
    queryFn: () => marketingApi.pipeline(),
  });

  const leadFilters = {
    status: leadStatus === "all" ? undefined : leadStatus,
    source: leadSource === "all" ? undefined : leadSource,
  };

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: queryKeys.crm.marketing.leads(JSON.stringify(leadFilters)),
    queryFn: () => marketingApi.listLeads(leadFilters),
  });

  const campaignFilters = {
    status: campaignStatus === "all" ? undefined : campaignStatus,
  };

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: queryKeys.crm.marketing.campaigns(JSON.stringify(campaignFilters)),
    queryFn: () => marketingApi.listCampaigns(campaignFilters),
  });

  if (pipelineLoading) {
    return <PageSkeleton variant="list" />;
  }

  const pipelineData = pipeline as Record<string, number> | undefined;

  return (
    <div className="space-y-6">
      {/* Pipeline summary cards */}
      {pipelineData && (
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {Object.entries(pipelineData).map(([stage, count]) => (
            <Card key={stage}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground capitalize">
                  {stage.replace(/_/g, " ")}
                </p>
                <p className="text-xl font-bold tabular-nums mt-1">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTab("leads")}
          className={
            tab === "leads"
              ? "border-b-2 border-foreground rounded-none"
              : "rounded-none text-muted-foreground"
          }
        >
          <Target className="h-4 w-4 mr-1.5" />
          Leads
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTab("campaigns")}
          className={
            tab === "campaigns"
              ? "border-b-2 border-foreground rounded-none"
              : "rounded-none text-muted-foreground"
          }
        >
          <Megaphone className="h-4 w-4 mr-1.5" />
          Campaigns
        </Button>
      </div>

      {/* Leads tab */}
      {tab === "leads" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            {LEAD_STATUSES.map((s) => (
              <Button
                key={s}
                variant={leadStatus === s ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setLeadStatus(s)}
              >
                {s === "all" ? "All" : s}
              </Button>
            ))}
            <span className="text-xs text-muted-foreground ml-2">Source:</span>
            {LEAD_SOURCES.map((s) => (
              <Button
                key={s}
                variant={leadSource === s ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setLeadSource(s)}
              >
                {s === "all" ? "All" : s}
              </Button>
            ))}
          </div>

          {leadsLoading ? (
            <PageSkeleton variant="list" />
          ) : !leads?.length ? (
            <EmptyState icon={Target} message="No leads found." />
          ) : (
            <div className="space-y-2">
              {leads.map((l: Lead) => (
                <Card key={l.lead_id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{l.company_name}</p>
                      <p className="text-xs text-muted-foreground">{l.contact_name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={l.status} />
                      <StatusBadge status={l.source} />
                      <span
                        className={`text-sm font-bold tabular-nums ${scoreColor(l.score)}`}
                      >
                        {l.score}
                      </span>
                      {l.assigned_agent_id && (
                        <span className="text-xs text-muted-foreground">
                          {l.assigned_agent_id}
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

      {/* Campaigns tab */}
      {tab === "campaigns" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            {["all", "draft", "active", "paused", "completed"].map((s) => (
              <Button
                key={s}
                variant={campaignStatus === s ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCampaignStatus(s)}
              >
                {s === "all" ? "All" : s}
              </Button>
            ))}
          </div>

          {campaignsLoading ? (
            <PageSkeleton variant="list" />
          ) : !campaigns?.length ? (
            <EmptyState icon={Megaphone} message="No campaigns found." />
          ) : (
            <div className="space-y-2">
              {campaigns.map((c: Campaign) => (
                <Card key={c.campaign_id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.campaign_type}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={c.status} />
                      <div className="text-right text-sm tabular-nums">
                        <span className="font-medium">{formatCents(c.spent_cents)}</span>
                        <span className="text-muted-foreground">
                          {" "}/ {formatCents(c.budget_cents)}
                        </span>
                      </div>
                      {c.start_date && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(c.start_date).toLocaleDateString()}
                          {c.end_date && ` \u2013 ${new Date(c.end_date).toLocaleDateString()}`}
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
    </div>
  );
}
