import Link from "next/link";

import { MetricCard, PageHeader, SectionCard } from "@/components/ui/blocks";
import { requireActiveFund } from "@/lib/fund/active";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { fundId, fund } = await requireActiveFund();
  const supabase = await createClient();

  const [
    { count: investmentCount },
    { count: companyCount },
    { count: investorCount },
    { count: capitalCallCount },
    { count: distributionCount },
    { count: dealCount },
    { count: complianceOpenCount },
    { data: perfRow },
  ] = await Promise.all([
    supabase.from("investments").select("*", { count: "exact", head: true }).eq("fund_id", fundId),
    supabase.from("portfolio_companies").select("*", { count: "exact", head: true }).eq("fund_id", fundId),
    supabase.from("fund_investors").select("*", { count: "exact", head: true }).eq("fund_id", fundId),
    supabase.from("capital_calls").select("*", { count: "exact", head: true }).eq("fund_id", fundId),
    supabase.from("distributions").select("*", { count: "exact", head: true }).eq("fund_id", fundId),
    supabase.from("deals").select("*", { count: "exact", head: true }).eq("fund_id", fundId),
    supabase
      .from("compliance_records")
      .select("*", { count: "exact", head: true })
      .eq("fund_id", fundId)
      .neq("status", "resolved"),
    supabase
      .from("performance_metrics")
      .select("irr, moic, dpi, rvpi, as_of_date")
      .eq("fund_id", fundId)
      .order("as_of_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <section className="ui-page">
      <PageHeader
        title="Dashboard"
        subtitle={`Active fund: ${fund?.name ?? "Unknown fund"}`}
        right={<span className="ui-pill">Live Overview</span>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Investments"
          value={String(investmentCount ?? 0)}
          helpText="Tracks lifecycle and ownership."
        />
        <MetricCard
          label="Portfolio Companies"
          value={String(companyCount ?? 0)}
          helpText="Pipeline, active, and exited holdings."
        />
        <MetricCard
          label="Fund Investors"
          value={String(investorCount ?? 0)}
          helpText="Investor commitment records by fund."
        />
        <MetricCard
          label="Capital Calls"
          value={String(capitalCallCount ?? 0)}
          helpText="Draft/issued/paid call workflow."
        />
        <MetricCard
          label="Distributions"
          value={String(distributionCount ?? 0)}
          helpText="LP distribution processing."
        />
        <MetricCard label="Deals" value={String(dealCount ?? 0)} helpText="Pipeline and due diligence flow." />
        <MetricCard
          label="Compliance Open"
          value={String(complianceOpenCount ?? 0)}
          helpText="Open or overdue compliance tasks."
        />
        <MetricCard
          label="MOIC"
          value={perfRow?.moic ? Number(perfRow.moic).toFixed(2) : "N/A"}
          helpText="Latest performance snapshot."
        />
      </div>

      <SectionCard
        title="Workspace Modules"
        subtitle="Navigate core product workflows with a consistent layout."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Link href="/portfolio" className="ui-btn ui-btn-secondary text-center">
            Portfolio
          </Link>
          <Link href="/capital" className="ui-btn ui-btn-secondary text-center">
            Capital
          </Link>
          <Link href="/operations" className="ui-btn ui-btn-secondary text-center">
            Operations
          </Link>
          <Link href="/analytics" className="ui-btn ui-btn-secondary text-center">
            Analytics
          </Link>
          <Link href="/portal" className="ui-btn ui-btn-secondary text-center">
            Investor Portal
          </Link>
        </div>
      </SectionCard>
    </section>
  );
}
