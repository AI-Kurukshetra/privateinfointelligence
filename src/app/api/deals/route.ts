import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { requireFundAccess } from "@/lib/api/guards";
import { createClient } from "@/lib/supabase/server";

const createDealSchema = z.object({
  company_name: z.string().min(2),
  sector: z.string().optional(),
  stage: z
    .enum(["sourced", "screening", "diligence", "ic_review", "approved", "closed", "rejected"])
    .default("sourced"),
  target_amount: z.number().positive().optional(),
  probability_pct: z.number().min(0).max(100).optional(),
  expected_close_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const access = await requireFundAccess(["admin", "operations", "investment_manager"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("fund_id", access.fundId)
    .order("created_at", { ascending: false });

  if (error) {
    return fail(400, { message: error.message });
  }

  return ok(data ?? []);
}

export async function POST(request: Request) {
  const access = await requireFundAccess(["admin", "investment_manager"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const parsed = createDealSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(422, { message: "Validation failed", details: parsed.error.flatten() });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
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
