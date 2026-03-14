import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicEnvStrict } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const env = getPublicEnvStrict();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot mutate cookies; middleware handles session refresh writes.
        }
      },
    },
  });
}
