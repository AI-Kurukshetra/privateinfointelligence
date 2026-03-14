import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="ui-shell min-h-screen px-6 py-14">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <header className="ui-card">
          <p className="ui-pill">Private Markets Intelligence Platform</p>
          <h1 className="mt-4 text-[28px] leading-[1.2] font-semibold text-[color:var(--text-primary)] sm:max-w-3xl">
            Built for fund operations, portfolio control, and investor reporting in one modern workspace.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--text-secondary)]">
            This application includes authenticated modules for portfolio management, capital operations, reporting,
            compliance, and analytics backed by Supabase.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="ui-btn ui-btn-primary">
              Open Web App
            </Link>
            <Link href="/portal" className="ui-btn ui-btn-secondary">
              Investor Portal
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Portfolio", "Companies, deals, investments, and valuations"],
            ["Capital", "Investors, calls, distributions, and cashflows"],
            ["Operations", "Documents, reports, compliance, workflows"],
            ["Analytics", "IRR, MOIC, DPI, RVPI, and TVPI"],
          ].map(([title, desc]) => (
            <article key={title} className="ui-card">
              <h2 className="text-[18px] font-semibold text-[color:var(--text-primary)]">{title}</h2>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{desc}</p>
            </article>
          ))}
        </section>

        <section className="ui-card">
          <h3 className="text-[18px] font-semibold text-[color:var(--text-primary)]">API Surface</h3>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">
            `/auth`, `/users`, `/funds`, `/investors`, `/portfolio-companies`, `/investments`, `/valuations`,
            `/capital-calls`, `/distributions`, `/deals`, `/cashflows`, `/documents`, `/reports`, `/compliance`,
            `/workflows`, `/communications`, `/tax-reports`, `/performance`, `/notifications`
          </p>
        </section>
      </div>
    </main>
  );
}
