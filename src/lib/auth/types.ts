export const APP_ROLES = ["admin", "investment_manager", "operations", "investor"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type FundRoleRecord = {
  fund_id: string;
  role: AppRole;
};
