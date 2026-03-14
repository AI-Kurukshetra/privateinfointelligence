import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { requireFundAccess } from "@/lib/api/guards";
import { createClient } from "@/lib/supabase/server";

const createComplianceSchema = z.object({
  title: z.string().min(2),
  requirement_type: z.string().min(2),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["open", "in_review", "resolved", "overdue"]).default("open"),
  notes: z.string().optional(),
});

export async function GET() {
  const access = await requireFundAccess(["admin", "operations", "investment_manager", "investor"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compliance_records")
    .select("*")
    .eq("fund_id", access.fundId)
    .order("due_date", { ascending: true });

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

  const parsed = createComplianceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(422, { message: "Validation failed", details: parsed.error.flatten() });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compliance_records")
    .insert({
      fund_id: access.fundId,
      ...parsed.data,
      owner_user_id: access.user.id,
    })
    .select("*")
    .single();

  if (error) {
    return fail(400, { message: error.message });
  }

  return ok(data, { status: 201 });
}
