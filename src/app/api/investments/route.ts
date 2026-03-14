import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { requireFundAccess } from "@/lib/api/guards";
import { createClient } from "@/lib/supabase/server";

const createInvestmentSchema = z.object({
  portfolio_company_id: z.string().uuid(),
  invested_amount: z.number().positive(),
  ownership_percentage: z.number().min(0).max(100),
  investment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  currency_code: z.string().length(3).default("USD"),
});

export async function GET() {
  const access = await requireFundAccess(["admin", "operations", "investment_manager"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investments")
    .select("*, portfolio_companies(name, stage)")
    .eq("fund_id", access.fundId)
    .order("investment_date", { ascending: false });

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

  const parsed = createInvestmentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(422, { message: "Validation failed", details: parsed.error.flatten() });
  }

  const supabase = await createClient();
  const payload = {
    ...parsed.data,
    fund_id: access.fundId,
  };

  const { data, error } = await supabase.from("investments").insert(payload).select("*").single();
  if (error) {
    return fail(400, { message: error.message });
  }

  return ok(data, { status: 201 });
}
