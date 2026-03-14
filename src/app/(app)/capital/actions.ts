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

  await supabase.from("distributions").insert({
    fund_id: fundId,
    title: String(formData.get("title") ?? "").trim(),
    payment_date: String(formData.get("payment_date") ?? ""),
    total_amount: Number(formData.get("total_amount") ?? 0),
    currency_code: String(formData.get("currency_code") ?? "USD"),
    status: String(formData.get("status") ?? "draft"),
  });

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
