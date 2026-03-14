import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { requireApiUser } from "@/lib/api/guards";
import { createClient } from "@/lib/supabase/server";

const createFundSchema = z.object({
  name: z.string().min(2),
  legal_name: z.string().min(2),
  base_currency: z.string().length(3).default("USD"),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return fail(401, { message: "Unauthorized" });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("funds(id, name, legal_name, base_currency)")
    .eq("user_id", auth.user.id);

  if (error) {
    return fail(400, { message: error.message });
  }

  return ok(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return fail(401, { message: "Unauthorized" });
  }

  const parsed = createFundSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(422, { message: "Validation failed", details: parsed.error.flatten() });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("funds").insert(parsed.data).select("*").single();

  if (error) {
    return fail(400, { message: error.message });
  }

  return ok(data, { status: 201 });
}
