import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { requireFundAccess } from "@/lib/api/guards";
import { createClient } from "@/lib/supabase/server";

const createDocumentSchema = z.object({
  title: z.string().min(2),
  storage_path: z.string().min(5),
  visibility: z.enum(["internal", "investor_shared", "restricted"]).default("internal"),
  mime_type: z.string().min(3),
});

export async function GET() {
  const access = await requireFundAccess(["admin", "operations", "investment_manager", "investor"]);
  if ("error" in access) {
    return fail(access.error === "Unauthorized" ? 401 : 403, { message: access.error });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
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

  const parsed = createDocumentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(422, { message: "Validation failed", details: parsed.error.flatten() });
  }

  if (!parsed.data.storage_path.startsWith(`fund/${access.fundId}/`)) {
    return fail(422, { message: "storage_path must start with fund/{fund_id}/" });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({ ...parsed.data, fund_id: access.fundId })
    .select("*")
    .single();

  if (error) {
    return fail(400, { message: error.message });
  }

  return ok(data, { status: 201 });
}
