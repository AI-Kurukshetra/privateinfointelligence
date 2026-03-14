const requiredPublicVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const requiredServerVars = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

function assertPresent(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

/**
 * Public env for browser and Edge (middleware). Returns empty strings if vars are missing
 * so middleware does not throw on Vercel when env is not yet configured.
 */
export function getPublicEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

/** Use in server-only code when Supabase is required; throws if env is missing. */
export function getPublicEnvStrict() {
  return {
    supabaseUrl: assertPresent(requiredPublicVars[0], process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: assertPresent(requiredPublicVars[1], process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function getServerEnv() {
  return {
    serviceRoleKey: assertPresent(requiredServerVars[0], process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}
