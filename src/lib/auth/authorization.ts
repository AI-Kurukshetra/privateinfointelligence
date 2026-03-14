import { APP_ROLES, type AppRole } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

type FundRoleRow = {
  fund_id: string;
  role: string;
  funds?: {
    id: string;
    name: string;
    legal_name: string;
    base_currency: string;
  } | null;
};

type RawFundRoleRow = {
  fund_id: string;
  role: string;
  funds?:
    | {
        id: string;
        name: string;
        legal_name: string;
        base_currency: string;
      }[]
    | {
        id: string;
        name: string;
        legal_name: string;
        base_currency: string;
      }
    | null;
};

export async function getUserRolesForFund(userId: string, fundId: string): Promise<AppRole[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("fund_id", fundId);

  if (error || !data) {
    return [];
  }

  return (data as FundRoleRow[])
    .map((row) => row.role)
    .filter((role): role is AppRole => APP_ROLES.includes(role as AppRole));
}

export async function hasFundRole(userId: string, fundId: string, acceptedRoles: AppRole[]) {
  const roles = await getUserRolesForFund(userId, fundId);
  return roles.some((role) => acceptedRoles.includes(role));
}

export async function getUserFundMemberships(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("fund_id, role, funds(id, name, legal_name, base_currency)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [] as FundRoleRow[];
  }

  return (data as RawFundRoleRow[]).map((row) => ({
    fund_id: row.fund_id,
    role: row.role,
    funds: Array.isArray(row.funds) ? (row.funds[0] ?? null) : (row.funds ?? null),
  }));
}
