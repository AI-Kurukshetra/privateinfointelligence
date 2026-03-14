import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { requireFundAccess } from "@/lib/api/guards";
import { createClient } from "@/lib/supabase/server";

const allocationSchema = z.object({
  fund_investor_id: z.string().uuid(),
  amount_due: z.number().positive(),
});

const createCapitalCallSchema = z.object({
  title: z.string().min(2),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  total_amount: z.number().positive(),
  currency_code: z.string().length(3).default("USD"),
  allocations: z.array(allocationSchema).min(1),
});

export async function GET() {
  const access = await requireFundAccess(["admin", "operations"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("capital_calls")
    .select("*, capital_call_allocations(*)")
    .eq("fund_id", access.fundId)
    .order("created_at", { ascending: false });

  if (error) {
    return fail(400, { message: error.message });
  }

  return ok(data ?? []);
}

export async function POST(request: Request) {
  const access = await requireFundAccess(["admin", "operations"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const parsed = createCapitalCallSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(422, { message: "Validation failed", details: parsed.error.flatten() });
  }

  const allocatedTotal = parsed.data.allocations.reduce((sum, item) => sum + item.amount_due, 0);
  if (Math.abs(allocatedTotal - parsed.data.total_amount) > 0.000001) {
    return fail(422, { message: "Allocation total must match total_amount" });
  }

  const supabase = await createClient();
  const { data: call, error: callError } = await supabase
    .from("capital_calls")
    .insert({
      fund_id: access.fundId,
      title: parsed.data.title,
      due_date: parsed.data.due_date,
      total_amount: parsed.data.total_amount,
      currency_code: parsed.data.currency_code,
      status: "draft",
    })
    .select("id, fund_id, title, due_date, total_amount, status")
    .single();

  if (callError) {
    return fail(400, { message: callError.message });
  }

  const allocationPayload = parsed.data.allocations.map((allocation) => ({
    capital_call_id: call.id,
    fund_investor_id: allocation.fund_investor_id,
    amount_due: allocation.amount_due,
  }));

  const { error: allocationError } = await supabase
    .from("capital_call_allocations")
    .insert(allocationPayload);

  if (allocationError) {
    return fail(400, { message: allocationError.message });
  }

  return ok(call, { status: 201 });
}
