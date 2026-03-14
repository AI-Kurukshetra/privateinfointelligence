import { setActiveFund } from "@/app/(app)/actions";
import { signOut } from "@/app/(auth)/login/actions";
import { DesktopSidebar, MobileSidebar } from "@/components/app/sidebar-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireSession } from "@/lib/auth/session";
import { getCurrentUserFundContext } from "@/lib/fund/context";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireSession();
  const fundContext = await getCurrentUserFundContext(user.id);

  return (
    <div className="ui-shell lg:flex">
      <DesktopSidebar />

      <div className="min-h-screen flex-1">
        <header className="ui-header">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div className="flex items-center gap-3">
              <MobileSidebar />
              <div>
                <p className="text-[12px] text-[color:var(--text-secondary)]">Signed in as</p>
                <p className="text-sm font-medium text-[color:var(--text-primary)]">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {fundContext.memberships.length > 0 ? (
                <form action={setActiveFund} className="flex items-center gap-2">
                  <select
                    name="fund_id"
                    defaultValue={fundContext.active?.fund_id}
                    className="ui-select min-w-48"
                  >
                    {fundContext.memberships.map((membership) => (
                      <option key={membership.fund_id} value={membership.fund_id}>
                        {(membership.funds?.name ?? "Fund")} ({membership.role})
                      </option>
                    ))}
                  </select>
                  <button className="ui-btn ui-btn-secondary" type="submit">
                    Switch
                  </button>
                </form>
              ) : (
                <span className="ui-pill">No fund role mapped</span>
              )}

              <form action={signOut}>
                <button className="ui-btn ui-btn-ghost" type="submit">
                  Sign out
                </button>
              </form>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="ui-main">
          <div className="ui-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
