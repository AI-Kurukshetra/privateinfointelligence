const requiredPublicVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const requiredServerVars = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

function assertPresent(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv() {
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
