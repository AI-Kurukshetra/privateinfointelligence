import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { requireFundAccess } from "@/lib/api/guards";
import { createClient } from "@/lib/supabase/server";

const createValuationSchema = z.object({
  investment_id: z.string().uuid(),
  as_of_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  fair_value: z.number().nonnegative(),
  method: z.string().min(2),
  status: z.enum(["draft", "approved", "published"]).default("draft"),
});

export async function GET() {
  const access = await requireFundAccess(["admin", "operations", "investment_manager"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("valuations")
    .select("*")
    .eq("fund_id", access.fundId)
    .order("as_of_date", { ascending: false });

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

  const parsed = createValuationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(422, { message: "Validation failed", details: parsed.error.flatten() });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("valuations")
    .insert({ ...parsed.data, fund_id: access.fundId })
    .select("*")
    .single();

  if (error) {
    return fail(400, { message: error.message });
  }

  return ok(data, { status: 201 });
}
