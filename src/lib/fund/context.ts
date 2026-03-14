import { cookies } from "next/headers";

import { getUserFundMemberships } from "@/lib/auth/authorization";

export const ACTIVE_FUND_COOKIE = "active_fund_id";

export type FundMembership = {
  fund_id: string;
  role: string;
  funds?: {
    id: string;
    name: string;
    legal_name: string;
    base_currency: string;
  } | null;
};

export async function getCurrentUserFundContext(userId: string) {
  const memberships = await getUserFundMemberships(userId);
  const cookieStore = await cookies();
  const selectedFundId = cookieStore.get(ACTIVE_FUND_COOKIE)?.value;

  if (memberships.length === 0) {
    return {
      active: null,
      memberships: [] as FundMembership[],
    };
  }

  const active =
    memberships.find((membership) => membership.fund_id === selectedFundId) ??
    memberships[0];

  return {
    active,
    memberships: memberships as FundMembership[],
  };
}
