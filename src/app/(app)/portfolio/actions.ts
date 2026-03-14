"use server";

import { revalidatePath } from "next/cache";

import { requireActiveFund } from "@/lib/fund/active";
import { createClient } from "@/lib/supabase/server";

export async function createPortfolioCompany(formData: FormData) {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  await supabase.from("portfolio_companies").insert({
    fund_id: fundId,
    name: String(formData.get("name") ?? "").trim(),
    sector: String(formData.get("sector") ?? "").trim(),
    stage: String(formData.get("stage") ?? "pipeline"),
    country: String(formData.get("country") ?? "").trim() || null,
  });

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
}

export async function createDeal(formData: FormData) {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  const targetAmount = Number(formData.get("target_amount") ?? 0);
  const probabilityPct = Number(formData.get("probability_pct") ?? 0);

  await supabase.from("deals").insert({
    fund_id: fundId,
    company_name: String(formData.get("company_name") ?? "").trim(),
    sector: String(formData.get("sector") ?? "").trim() || null,
    stage: String(formData.get("stage") ?? "sourced"),
    target_amount: Number.isFinite(targetAmount) && targetAmount > 0 ? targetAmount : null,
    probability_pct: Number.isFinite(probabilityPct) ? probabilityPct : null,
    expected_close_date: String(formData.get("expected_close_date") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
}

export async function createInvestment(formData: FormData) {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  await supabase.from("investments").insert({
    fund_id: fundId,
    portfolio_company_id: String(formData.get("portfolio_company_id") ?? ""),
    invested_amount: Number(formData.get("invested_amount") ?? 0),
    ownership_percentage: Number(formData.get("ownership_percentage") ?? 0),
    investment_date: String(formData.get("investment_date") ?? ""),
    currency_code: String(formData.get("currency_code") ?? "USD"),
  });

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function createValuation(formData: FormData) {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  await supabase.from("valuations").insert({
    fund_id: fundId,
    investment_id: String(formData.get("investment_id") ?? ""),
    as_of_date: String(formData.get("as_of_date") ?? ""),
    fair_value: Number(formData.get("fair_value") ?? 0),
    method: String(formData.get("method") ?? "").trim(),
    status: String(formData.get("status") ?? "draft"),
  });

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}
