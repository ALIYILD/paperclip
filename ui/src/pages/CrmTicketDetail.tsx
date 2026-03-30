import { useEffect, useState } from "react";
import { useParams } from "@/lib/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketsApi } from "../api/crm";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusBadge } from "../components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketCheck, ArrowRight } from "lucide-react";
import { timeAgo } from "../lib/timeAgo";
import { formatDateTime } from "../lib/utils";
import type { Ticket, TicketComment, TicketEvent } from "../api/crm";

const severityColor: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

export function CrmTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"comments" | "events">("comments");
  const [commentBody, setCommentBody] = useState("");
  const [commentInternal, setCommentInternal] = useState(false);

  const {
    data: ticket,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.crm.tickets.detail(ticketId!),
    queryFn: () => ticketsApi.get(ticketId!),
    enabled: !!ticketId,
  });

  const { data: comments } = useQuery({
    queryKey: queryKeys.crm.tickets.comments(ticketId!),
    queryFn: () => ticketsApi.listComments(ticketId!),
    enabled: !!ticketId,
  });

  const { data: events } = useQuery({
    queryKey: queryKeys.crm.tickets.events(ticketId!),
    queryFn: () => ticketsApi.listEvents(ticketId!),
    enabled: !!ticketId,
  });

  const addComment = useMutation({
    mutationFn: (data: Partial<TicketComment>) => ticketsApi.addComment(ticketId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.tickets.comments(ticketId!) });
      setCommentBody("");
      setCommentInternal(false);
    },
  });

  useEffect(() => {
    if (ticket) {
      setBreadcrumbs([
        { label: "Tickets", href: "/tickets" },
        { label: ticket.ticket_number || ticket.ticket_id },
      ]);
    } else {
      setBreadcrumbs([
        { label: "Tickets", href: "/tickets" },
        { label: ticketId ?? "" },
      ]);
    }
  }, [setBreadcrumbs, ticket, ticketId]);

  if (isLoading) {
    return <PageSkeleton variant="detail" />;
  }

  if (error) {
    return <EmptyState icon={TicketCheck} message={(error as Error).message} />;
  }

  if (!ticket) {
    return <EmptyState icon={TicketCheck} message="Ticket not found." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-mono">
          {ticket.ticket_number ?? ticket.ticket_id}
        </p>
        <h1 className="text-xl font-semibold">{ticket.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${
              severityColor[ticket.severity] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {ticket.severity}
          </span>
          <StatusBadge status={ticket.status} />
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap bg-zinc-800 text-zinc-300">
            {ticket.category.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Info section */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assigned Team</p>
              <p className="font-medium">{ticket.assigned_team || "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Escalation Level</p>
              <p className="font-medium">{ticket.escalation_level || "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Source Type</p>
              <p className="font-medium">{ticket.source_type || "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Customer ID</p>
              <p className="font-medium font-mono text-xs">{ticket.customer_id || "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">SLA Due</p>
              <p className="font-medium">{ticket.sla_due_at ? formatDateTime(ticket.sla_due_at) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">First Response Due</p>
              <p className="font-medium">{ticket.first_response_due_at ? formatDateTime(ticket.first_response_due_at) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Resolution Due</p>
              <p className="font-medium">{ticket.resolution_due_at ? formatDateTime(ticket.resolution_due_at) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="font-medium">{ticket.created_at ? formatDateTime(ticket.created_at) : "--"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {ticket.description && (
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Description</p>
            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("comments")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "comments"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Comments
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "events"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Events
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "comments" && (
        <div className="space-y-4">
          {comments && comments.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No comments yet.</p>
          )}

          {comments && comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.comment_id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">{comment.author_name ?? "Unknown"}</span>
                      {comment.is_internal && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          internal
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {comment.created_at ? timeAgo(comment.created_at) : ""}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add comment form */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={commentInternal}
                    onChange={(e) => setCommentInternal(e.target.checked)}
                    className="rounded border-border"
                  />
                  Internal note
                </label>
                <Button
                  size="sm"
                  disabled={!commentBody.trim() || addComment.isPending}
                  onClick={() =>
                    addComment.mutate({
                      body: commentBody.trim(),
                      is_internal: commentInternal,
                    })
                  }
                >
                  {addComment.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "events" && (
        <div className="space-y-2">
          {events && events.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No events recorded.</p>
          )}

          {events && events.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {events.map((event) => (
                    <div
                      key={event.event_id}
                      className="flex items-center gap-3 px-4 py-3 text-sm"
                    >
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap bg-zinc-800 text-zinc-300">
                        {event.event_type.replace(/_/g, " ")}
                      </span>

                      <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {event.old_value && (
                          <span className="truncate">{event.old_value}</span>
                        )}
                        {event.old_value && event.new_value && (
                          <ArrowRight className="h-3 w-3 shrink-0" />
                        )}
                        {event.new_value && (
                          <span className="truncate font-medium text-foreground">{event.new_value}</span>
                        )}
                      </div>

                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {event.actor_name ?? "System"}
                      </span>

                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {event.created_at ? timeAgo(event.created_at) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
