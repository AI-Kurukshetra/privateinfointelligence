"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hasFundRole } from "@/lib/auth/authorization";
import { requireSession } from "@/lib/auth/session";
import { ACTIVE_FUND_COOKIE } from "@/lib/fund/context";

export async function setActiveFund(formData: FormData) {
  const user = await requireSession();
  const fundId = String(formData.get("fund_id") ?? "");

  if (!fundId) {
    return;
  }

  const allowed = await hasFundRole(user.id, fundId, [
    "admin",
    "investment_manager",
    "operations",
    "investor",
  ]);

  if (!allowed) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FUND_COOKIE, fundId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}
