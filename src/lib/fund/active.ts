import { requireSession } from "@/lib/auth/session";
import { getCurrentUserFundContext } from "@/lib/fund/context";

export async function requireActiveFund() {
  const user = await requireSession();
  const context = await getCurrentUserFundContext(user.id);

  if (!context.active) {
    throw new Error("No active fund found. Assign a user role to at least one fund.");
  }

  return {
    user,
    fundId: context.active.fund_id,
    role: context.active.role,
    fund: context.active.funds,
  };
}
