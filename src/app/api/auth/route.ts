import { fail, ok } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail(401, { message: "Unauthorized" });
  }

  return ok({
    id: user.id,
    email: user.email,
    lastSignInAt: user.last_sign_in_at,
  });
}
