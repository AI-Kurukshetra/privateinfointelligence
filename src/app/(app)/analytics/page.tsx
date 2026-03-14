import { MetricCard, PageHeader, SectionCard } from "@/components/ui/blocks";
import { computePrivateMarketMetrics, xirr } from "@/lib/finance/metrics";
import { requireActiveFund } from "@/lib/fund/active";
import { createClient } from "@/lib/supabase/server";

function formatValue(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return `${value.toFixed(3)}${suffix}`;
}

export default async function AnalyticsPage() {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  const [
    { data: valuationRows },
    { data: capitalCallRows },
    { data: distributionRows },
    { data: cashflowRows },
    { data: snapshotRows },
  ] = await Promise.all([
    supabase.from("valuations").select("as_of_date, fair_value").eq("fund_id", fundId).eq("status", "published"),
    supabase
      .from("capital_calls")
      .select("total_amount")
      .eq("fund_id", fundId)
      .in("status", ["issued", "partially_paid", "paid"]),
    supabase.from("distributions").select("total_amount").eq("fund_id", fundId).eq("status", "paid"),
    supabase.from("cashflows").select("flow_type, amount, occurred_on").eq("fund_id", fundId),
    supabase
      .from("performance_metrics")
      .select("as_of_date, irr, moic, dpi, rvpi")
      .eq("fund_id", fundId)
      .order("as_of_date", { ascending: false })
      .limit(10),
  ]);

  const nav = (valuationRows ?? []).reduce((sum, row) => sum + Number(row.fair_value ?? 0), 0);
  const calls = (capitalCallRows ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
  const dists = (distributionRows ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
  const metrics = computePrivateMarketMetrics({
    contributions: calls,
    distributions: dists,
    nav,
  });

  const irrFlows = [
    ...(cashflowRows ?? []).map((flow) => ({
      date: new Date(String(flow.occurred_on)),
      amount:
        flow.flow_type === "capital_call" || flow.flow_type === "investment" || flow.flow_type === "expense"
          ? -Number(flow.amount ?? 0)
          : Number(flow.amount ?? 0),
    })),
    ...(nav > 0 ? [{ date: new Date(), amount: nav }] : []),
  ]
    .filter((flow) => flow.amount !== 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const irr = xirr(irrFlows);

  return (
    <div className="ui-page">
      <PageHeader
        title="Performance Analytics"
        subtitle="IRR, MOIC, DPI, RVPI, and TVPI from fund cashflows and published valuations."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="IRR"
          value={formatValue(irr ? irr * 100 : null, "%")}
          helpText="XIRR from cashflows + NAV terminal value."
        />
        <MetricCard label="MOIC" value={formatValue(metrics.moic)} helpText="(Distributions + NAV) / Paid-in Capital." />
        <MetricCard label="DPI" value={formatValue(metrics.dpi)} helpText="Distributions / Paid-in Capital." />
        <MetricCard label="RVPI" value={formatValue(metrics.rvpi)} helpText="Residual Value / Paid-in Capital." />
        <MetricCard label="TVPI" value={formatValue(metrics.tvpi)} helpText="DPI + RVPI." />
      </div>

      <SectionCard title="Current Inputs" subtitle="Values currently used for analytics calculations">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="ui-card">
            <p className="ui-muted">Paid-in Capital</p>
            <p className="ui-metric-value mt-2">{calls.toLocaleString()}</p>
          </div>
          <div className="ui-card">
            <p className="ui-muted">Distributions</p>
            <p className="ui-metric-value mt-2">{dists.toLocaleString()}</p>
          </div>
          <div className="ui-card">
            <p className="ui-muted">NAV</p>
            <p className="ui-metric-value mt-2">{nav.toLocaleString()}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Saved Performance Snapshots" subtitle="Period-end metrics history">
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>As of</th>
                <th>IRR</th>
                <th>MOIC</th>
                <th>DPI</th>
                <th>RVPI</th>
              </tr>
            </thead>
            <tbody>
              {(snapshotRows ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-[color:var(--text-secondary)]">
                    No saved snapshots yet. Use scheduled jobs to persist period-end metrics.
                  </td>
                </tr>
              ) : (
                (snapshotRows ?? []).map((row) => (
                  <tr key={`${row.as_of_date}`}>
                    <td>{row.as_of_date}</td>
                    <td>{row.irr ?? "N/A"}</td>
                    <td>{row.moic ?? "N/A"}</td>
                    <td>{row.dpi ?? "N/A"}</td>
                    <td>{row.rvpi ?? "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
