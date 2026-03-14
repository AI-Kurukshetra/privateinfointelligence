import { cookies, headers } from "next/headers";
import type { User } from "@supabase/supabase-js";

import { getUserFundMemberships, hasFundRole } from "@/lib/auth/authorization";
import type { AppRole } from "@/lib/auth/types";
import { ACTIVE_FUND_COOKIE } from "@/lib/fund/context";
import { createClient } from "@/lib/supabase/server";

export async function getFundIdFromHeaders() {
  const headerStore = await headers();
  return headerStore.get("x-fund-id");
}

type ApiUserResult = { user: User } | { error: "Unauthorized" };

export async function requireApiUser(): Promise<ApiUserResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" } as const;
  }

  return { user };
}

type FundAccessResult =
  | { user: User; fundId: string }
  | { error: "Unauthorized" | "Missing x-fund-id header" | "Forbidden" };

export async function requireFundAccess(allowedRoles: AppRole[]): Promise<FundAccessResult> {
  const auth = await requireApiUser();

  if ("error" in auth) {
    return { error: "Unauthorized" as const };
  }

  const headerFundId = await getFundIdFromHeaders();
  const cookieStore = await cookies();
  const cookieFundId = cookieStore.get(ACTIVE_FUND_COOKIE)?.value;

  const requestedFundId = headerFundId ?? cookieFundId;

  if (requestedFundId) {
    const canAccessRequested = await hasFundRole(auth.user.id, requestedFundId, allowedRoles);
    if (canAccessRequested) {
      return { user: auth.user, fundId: requestedFundId };
    }
    return { error: "Forbidden" as const };
  }

  const memberships = await getUserFundMemberships(auth.user.id);
  const fallbackMembership = memberships.find((membership) =>
    allowedRoles.includes(membership.role as AppRole),
  );

  if (!fallbackMembership) {
    return { error: "Forbidden" as const };
  }

  return { user: auth.user, fundId: fallbackMembership.fund_id };
}
