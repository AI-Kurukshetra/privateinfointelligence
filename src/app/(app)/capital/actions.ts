"use server";

import { revalidatePath } from "next/cache";

import { requireActiveFund } from "@/lib/fund/active";
import { createClient } from "@/lib/supabase/server";

export async function createInvestor(formData: FormData) {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  const { data: investor } = await supabase
    .from("investors")
    .insert({
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
    })
    .select("id")
    .single();

  if (!investor) {
    return;
  }

  await supabase.from("fund_investors").insert({
    fund_id: fundId,
    investor_id: investor.id,
    commitment_amount: Number(formData.get("commitment_amount") ?? 0),
    currency_code: String(formData.get("currency_code") ?? "USD"),
  });

  revalidatePath("/capital");
  revalidatePath("/dashboard");
}

export async function createCapitalCall(formData: FormData) {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  await supabase.from("capital_calls").insert({
    fund_id: fundId,
    title: String(formData.get("title") ?? "").trim(),
    due_date: String(formData.get("due_date") ?? ""),
    total_amount: Number(formData.get("total_amount") ?? 0),
    currency_code: String(formData.get("currency_code") ?? "USD"),
    status: String(formData.get("status") ?? "draft"),
  });

  revalidatePath("/capital");
  revalidatePath("/dashboard");
}

export async function createDistribution(formData: FormData) {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  const { data: distribution, error: insertError } = await supabase
    .from("distributions")
    .insert({
      fund_id: fundId,
      title: String(formData.get("title") ?? "").trim(),
      payment_date: String(formData.get("payment_date") ?? ""),
      total_amount: Number(formData.get("total_amount") ?? 0),
      currency_code: String(formData.get("currency_code") ?? "USD"),
      status: String(formData.get("status") ?? "draft"),
    })
    .select("id")
    .single();

  if (insertError || !distribution) {
    revalidatePath("/capital");
    return;
  }

  const autoAllocate = formData.get("auto_allocate") === "true";
  if (autoAllocate && Number(formData.get("total_amount") ?? 0) > 0) {
    await calculateDistributionAllocations(distribution.id);
  }

  revalidatePath("/capital");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function runCalculateDistributionAllocations(formData: FormData) {
  const distributionId = String(formData.get("distribution_id") ?? "").trim();
  if (distributionId) {
    await calculateDistributionAllocations(distributionId);
  }
}

/**
 * Waterfall / allocation: pro-rata by commitment.
 * Computes each LP's share as (commitment_amount / total_commitment) * distribution total,
 * then inserts or updates distribution_allocations (draft only).
 */
export async function calculateDistributionAllocations(distributionId: string) {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  const { data: distribution, error: distErr } = await supabase
    .from("distributions")
    .select("id, fund_id, total_amount, status")
    .eq("id", distributionId)
    .eq("fund_id", fundId)
    .single();

  if (distErr || !distribution || distribution.status !== "draft") {
    return;
  }

  const totalAmount = Number(distribution.total_amount ?? 0);
  if (totalAmount <= 0) return;

  const { data: fundInvestors, error: invErr } = await supabase
    .from("fund_investors")
    .select("id, commitment_amount")
    .eq("fund_id", fundId);

  if (invErr || !fundInvestors?.length) return;

  const totalCommitment = fundInvestors.reduce((s, i) => s + Number(i.commitment_amount ?? 0), 0);
  if (totalCommitment <= 0) return;

  // Delete existing allocations so we can recalc (only for draft).
  await supabase
    .from("distribution_allocations")
    .delete()
    .eq("distribution_id", distributionId);

  const allocations: { distribution_id: string; fund_investor_id: string; amount: number }[] = [];
  let allocatedSum = 0;
  const lastIndex = fundInvestors.length - 1;

  fundInvestors.forEach((inv, i) => {
    const commitment = Number(inv.commitment_amount ?? 0);
    const share = totalCommitment > 0 ? commitment / totalCommitment : 0;
    const amount =
      i === lastIndex
        ? Math.round((totalAmount - allocatedSum) * 100) / 100
        : Math.round(totalAmount * share * 100) / 100;
    allocatedSum += amount;
    allocations.push({
      distribution_id: distributionId,
      fund_investor_id: inv.id,
      amount: Math.max(0, amount),
    });
  });

  if (allocations.length > 0) {
    await supabase.from("distribution_allocations").insert(allocations);
  }

  revalidatePath("/capital");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function createCashflow(formData: FormData) {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  await supabase.from("cashflows").insert({
    fund_id: fundId,
    flow_type: String(formData.get("flow_type") ?? "capital_call"),
    occurred_on: String(formData.get("occurred_on") ?? ""),
    amount: Number(formData.get("amount") ?? 0),
    currency_code: String(formData.get("currency_code") ?? "USD"),
    reference_type: String(formData.get("reference_type") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
  });

  revalidatePath("/capital");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}
