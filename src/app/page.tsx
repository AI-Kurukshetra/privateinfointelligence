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
    <main className="ui-shell ui-public min-h-screen">
      <div className="ui-main mx-auto flex w-full flex-col gap-6">
        <header className="ui-landing-nav">
          <div className="flex items-center gap-3 px-2">
            <p className="text-lg font-bold tracking-tight text-[color:var(--text-primary)]">Maybern Suite</p>
            <span className="ui-pill">Fund Ops Platform</span>
          </div>
          <nav className="ui-landing-links">
            <span>Portfolio</span>
            <span>Capital</span>
            <span>Operations</span>
            <span>Analytics</span>
          </nav>
          <Link href="/login" className="ui-btn ui-btn-primary">
            Open App
          </Link>
        </header>

        <section className="ui-hero-card">
          <div className="ui-hero-grid">
            <div>
              <p className="ui-pill">Private Markets Intelligence Platform</p>
              <h1 className="mt-5 max-w-2xl text-[clamp(2rem,4.8vw,4rem)] leading-[1.02] font-bold tracking-[-0.03em] text-[color:var(--text-primary)]">
                Fund operations with a <span className="ui-gradient-text">modern command center</span> for portfolio,
                capital, and LP reporting.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-[color:var(--text-secondary)]">
                Run investment workflows, automate reporting, and deliver investor visibility in a clean, fast, and
                beautifully structured workspace.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/login" className="ui-btn ui-btn-primary">
                  Start Workspace
                </Link>
                <Link href="/portal" className="ui-btn ui-btn-secondary">
                  Open Investor Portal
                </Link>
              </div>
              <div className="ui-tag-cloud mt-7">
                {["RLS Security", "Realtime KPIs", "Audit Trail", "Capital Calls", "LP Reports"].map((item) => (
                  <span key={item} className="ui-tag">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="ui-kpi-board">
              <p className="text-xs font-semibold tracking-[0.08em] text-[color:var(--text-secondary)] uppercase">
                Live Operations Snapshot
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ["AUM", "$12.4M"],
                  ["Open Deals", "7"],
                  ["Calls This Q", "2"],
                  ["MOIC", "1.33x"],
                ].map(([label, value]) => (
                  <article key={label} className="rounded-2xl border border-[color:var(--divider)] bg-[color:var(--surface-solid)] p-3">
                    <p className="text-[11px] text-[color:var(--text-secondary)]">{label}</p>
                    <p className="mt-1 text-lg font-semibold text-[color:var(--text-primary)]">{value}</p>
                  </article>
                ))}
              </div>
              <div className="ui-kpi-chart" />
            </div>
          </div>
        </section>

        <section className="ui-feature-grid">
          {[
            ["Portfolio", "Companies, pipeline deals, investments, and valuation timeline."],
            ["Capital", "LP commitments, calls, distributions, and cashflow control."],
            ["Operations", "Documents, compliance workflows, communications, and tax prep."],
            ["Analytics", "IRR, MOIC, DPI, RVPI, and TVPI with saved snapshots."],
          ].map(([title, desc]) => (
            <article key={title} className="ui-card">
              <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">{title}</h2>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{desc}</p>
            </article>
          ))}
        </section>

        <section className="ui-cta">
          <p className="text-xs font-semibold tracking-[0.08em] uppercase text-white/85">API-First Foundation</p>
          <h2 className="mt-3 text-[clamp(1.5rem,2.5vw,2.2rem)] leading-[1.1] font-semibold">
            Built on Next.js + Supabase with complete fund operations modules.
          </h2>
          <p className="mt-3 max-w-4xl text-sm text-white/90">
            `/auth`, `/users`, `/funds`, `/investors`, `/portfolio-companies`, `/investments`, `/valuations`,
            `/capital-calls`, `/distributions`, `/deals`, `/cashflows`, `/documents`, `/reports`, `/compliance`,
            `/workflows`, `/communications`, `/tax-reports`, `/performance`, `/notifications`
          </p>
        </section>
      </div>
    </main>
  );
}
