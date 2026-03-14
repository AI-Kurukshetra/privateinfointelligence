import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { requireFundAccess } from "@/lib/api/guards";
import { createClient } from "@/lib/supabase/server";

const createDistributionSchema = z.object({
  title: z.string().min(2),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_amount: z.number().positive(),
  currency_code: z.string().length(3).default("USD"),
  status: z.enum(["draft", "approved", "paid", "cancelled"]).default("draft"),
});

export async function GET() {
  const access = await requireFundAccess(["admin", "operations", "investment_manager", "investor"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("distributions")
    .select("*, distribution_allocations(*)")
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

  const parsed = createDistributionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(422, { message: "Validation failed", details: parsed.error.flatten() });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("distributions")
    .insert({
      fund_id: access.fundId,
      ...parsed.data,
    })
    .select("*")
    .single();

  if (error) {
    return fail(400, { message: error.message });
  }

  return ok(data, { status: 201 });
}
