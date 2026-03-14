import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { requireFundAccess } from "@/lib/api/guards";
import { createClient } from "@/lib/supabase/server";

const createInvestorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  commitment_amount: z.number().nonnegative(),
  currency_code: z.string().length(3).default("USD"),
});

export async function GET() {
  const access = await requireFundAccess(["admin", "operations", "investment_manager"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fund_investors")
    .select("id, investor_id, commitment_amount, paid_in_amount, investors(name, email)")
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

  const parsed = createInvestorSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(422, { message: "Validation failed", details: parsed.error.flatten() });
  }

  const supabase = await createClient();

  const { data: investor, error: investorError } = await supabase
    .from("investors")
    .insert({ name: parsed.data.name, email: parsed.data.email })
    .select("id, name, email")
    .single();

  if (investorError) {
    return fail(400, { message: investorError.message });
  }

  const { data, error } = await supabase
    .from("fund_investors")
    .insert({
      fund_id: access.fundId,
      investor_id: investor.id,
      commitment_amount: parsed.data.commitment_amount,
      currency_code: parsed.data.currency_code,
    })
    .select("id, fund_id, investor_id, commitment_amount, currency_code")
    .single();

  if (error) {
    return fail(400, { message: error.message });
  }

  return ok(data, { status: 201 });
}
