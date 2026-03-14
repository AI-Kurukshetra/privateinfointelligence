import { fail, ok } from "@/lib/api/http";
import { requireFundAccess } from "@/lib/api/guards";
import { computePrivateMarketMetrics, xirr } from "@/lib/finance/metrics";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const access = await requireFundAccess(["admin", "operations", "investment_manager", "investor"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const supabase = await createClient();

  const [
    { data: valuationRows, error: valuationError },
    { data: investmentRows, error: investmentError },
    { data: cashflowRows, error: cashflowError },
    { data: distributionRows, error: distributionError },
    { data: capitalCallRows, error: callError },
  ] =
    await Promise.all([
      supabase
        .from("valuations")
        .select("fair_value")
        .eq("fund_id", access.fundId)
        .eq("status", "published"),
      supabase.from("investments").select("invested_amount").eq("fund_id", access.fundId),
      supabase.from("cashflows").select("flow_type, amount, occurred_on").eq("fund_id", access.fundId),
      supabase.from("distributions").select("total_amount").eq("fund_id", access.fundId).eq("status", "paid"),
      supabase
        .from("capital_calls")
        .select("total_amount")
        .eq("fund_id", access.fundId)
        .in("status", ["issued", "partially_paid", "paid"]),
    ]);

  if (valuationError || investmentError || cashflowError || distributionError || callError) {
    return fail(400, {
      message:
        valuationError?.message ??
        investmentError?.message ??
        cashflowError?.message ??
        distributionError?.message ??
        callError?.message ??
        "Failed to load data",
    });
  }

  const totalInvested = (investmentRows ?? []).reduce(
    (sum, row) => sum + Number(row.invested_amount ?? 0),
    0,
  );
  const totalFairValue = (valuationRows ?? []).reduce((sum, row) => sum + Number(row.fair_value ?? 0), 0);

  const capitalCallsTotal = (capitalCallRows ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
  const paidDistributionsTotal = (distributionRows ?? []).reduce(
    (sum, row) => sum + Number(row.total_amount ?? 0),
    0,
  );

  const contributions =
    capitalCallsTotal > 0
      ? capitalCallsTotal
      : (cashflowRows ?? [])
          .filter((row) => row.flow_type === "capital_call")
          .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const distributions =
    paidDistributionsTotal > 0
      ? paidDistributionsTotal
      : (cashflowRows ?? [])
          .filter((row) => row.flow_type === "distribution")
          .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  const metrics = computePrivateMarketMetrics({
    contributions,
    distributions,
    nav: totalFairValue,
  });

  const irrCashflows = [
    ...(cashflowRows ?? []).map((flow) => {
      let amount = Number(flow.amount ?? 0);
      if (flow.flow_type === "capital_call" || flow.flow_type === "investment" || flow.flow_type === "expense") {
        amount *= -1;
      }
      return {
        date: new Date(String(flow.occurred_on)),
        amount,
      };
    }),
    ...(totalFairValue > 0
      ? [
          {
            date: new Date(),
            amount: totalFairValue,
          },
        ]
      : []),
  ]
    .filter((flow) => Number.isFinite(flow.amount) && flow.amount !== 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const irr = xirr(irrCashflows);

  return ok({
    fund_id: access.fundId,
    total_invested: totalInvested,
    total_fair_value: totalFairValue,
    contributions,
    distributions,
    moic: metrics.moic,
    dpi: metrics.dpi,
    rvpi: metrics.rvpi,
    tvpi: metrics.tvpi,
    irr,
  });
}
