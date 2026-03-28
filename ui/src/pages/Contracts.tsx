import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { contractsApi, Contract, Invoice, Quote, Renewal } from "../api/crm";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusBadge } from "../components/StatusBadge";
import { formatCents } from "../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, FileQuestion, RefreshCw } from "lucide-react";

type Tab = "contracts" | "invoices" | "quotes" | "renewals";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "contracts", label: "Contracts", icon: FileText },
  { key: "invoices", label: "Invoices", icon: Receipt },
  { key: "quotes", label: "Quotes", icon: FileQuestion },
  { key: "renewals", label: "Renewals", icon: RefreshCw },
];

export function Contracts() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [tab, setTab] = useState<Tab>("contracts");

  useEffect(() => {
    setBreadcrumbs([{ label: "Contracts" }]);
  }, [setBreadcrumbs]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.crm.contracts.summary,
    queryFn: () => contractsApi.summary(),
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: queryKeys.crm.contracts.list(),
    queryFn: () => contractsApi.list(),
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: queryKeys.crm.contracts.invoices(),
    queryFn: () => contractsApi.listInvoices(),
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: queryKeys.crm.contracts.quotes(),
    queryFn: () => contractsApi.listQuotes(),
  });

  const { data: renewals, isLoading: renewalsLoading } = useQuery({
    queryKey: queryKeys.crm.contracts.renewals(),
    queryFn: () => contractsApi.listRenewals(),
  });

  if (summaryLoading) {
    return <PageSkeleton variant="list" />;
  }

  const summaryData = summary as Record<string, number> | undefined;

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      {summaryData && (
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {Object.entries(summaryData).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-xl font-bold tabular-nums mt-1">
                  {typeof value === "number" && key.toLowerCase().includes("cent")
                    ? formatCents(value)
                    : value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

      {/* Contracts tab */}
      {tab === "contracts" && (
        <>
          {contractsLoading ? (
            <PageSkeleton variant="list" />
          ) : !contracts?.length ? (
            <EmptyState icon={FileText} message="No contracts yet." />
          ) : (
            <div className="space-y-2">
              {contracts.map((c: Contract) => (
                <Card key={c.contract_id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.customer_id} &middot; {c.contract_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-sm tabular-nums">
                        <span className="font-medium">{formatCents(c.value_monthly_cents)}/mo</span>
                        <span className="text-xs text-muted-foreground block">
                          {formatCents(c.value_annual_cents)}/yr
                        </span>
                      </div>
                      <StatusBadge status={c.status} />
                      {c.start_date && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(c.start_date).toLocaleDateString()} &ndash;{" "}
                          {c.end_date ? new Date(c.end_date).toLocaleDateString() : "ongoing"}
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

      {/* Invoices tab */}
      {tab === "invoices" && (
        <>
          {invoicesLoading ? (
            <PageSkeleton variant="list" />
          ) : !invoices?.length ? (
            <EmptyState icon={Receipt} message="No invoices yet." />
          ) : (
            <div className="space-y-2">
              {invoices.map((inv: Invoice) => {
                const overdue =
                  inv.status !== "paid" &&
                  inv.due_date &&
                  new Date(inv.due_date) < new Date();
                return (
                  <Card
                    key={inv.invoice_id}
                    className={overdue ? "border-red-400/50" : ""}
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {inv.invoice_number ?? inv.invoice_id}
                          {overdue && (
                            <span className="text-xs text-red-500 ml-2">OVERDUE</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{inv.customer_id}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium tabular-nums">
                          {formatCents(inv.amount_cents)}
                        </span>
                        <StatusBadge status={inv.status} />
                        {inv.due_date && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            Due {new Date(inv.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Quotes tab */}
      {tab === "quotes" && (
        <>
          {quotesLoading ? (
            <PageSkeleton variant="list" />
          ) : !quotes?.length ? (
            <EmptyState icon={FileQuestion} message="No quotes yet." />
          ) : (
            <div className="space-y-2">
              {quotes.map((q: Quote) => (
                <Card key={q.quote_id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {q.quote_number ?? q.quote_id} &mdash; {q.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCents(q.total_cents)}
                      </span>
                      <StatusBadge status={q.status} />
                      {q.valid_until && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Valid until {new Date(q.valid_until).toLocaleDateString()}
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

      {/* Renewals tab */}
      {tab === "renewals" && (
        <>
          {renewalsLoading ? (
            <PageSkeleton variant="list" />
          ) : !renewals?.length ? (
            <EmptyState icon={RefreshCw} message="No renewals yet." />
          ) : (
            <div className="space-y-2">
              {renewals.map((r: Renewal) => (
                <Card key={r.renewal_id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.customer_id}</p>
                      {r.renewal_date && (
                        <p className="text-xs text-muted-foreground">
                          Renewal {new Date(r.renewal_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-sm tabular-nums">
                        <span className="text-muted-foreground">
                          {formatCents(r.current_value_cents)}
                        </span>
                        <span className="mx-1">&rarr;</span>
                        <span className="font-medium">
                          {formatCents(r.proposed_value_cents)}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium tabular-nums ${
                          r.risk_score >= 70
                            ? "text-red-500"
                            : r.risk_score >= 40
                              ? "text-yellow-500"
                              : "text-green-500"
                        }`}
                      >
                        Risk {r.risk_score}
                      </span>
                      <StatusBadge status={r.status} />
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
