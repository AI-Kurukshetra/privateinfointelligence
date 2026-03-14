import Link from "next/link";

import { signIn } from "@/app/(auth)/login/actions";
import { SubmitButton } from "@/components/ui/submit-button";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="ui-shell flex min-h-screen items-center px-6 py-12">
      <div className="mx-auto w-full max-w-[1040px]">
        <div className="ui-auth-wrap">
          <aside className="ui-auth-brand">
            <p className="ui-pill border-white/40 bg-white/20 text-white">Secure Workspace Access</p>
            <h1 className="mt-5 text-[clamp(1.8rem,3.3vw,2.9rem)] leading-[1.08] font-semibold tracking-[-0.02em]">
              Private Markets Platform for Fund Teams and LP Portals
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/90">
              Centralize portfolio insights, capital operations, compliance activity, and investor communication with a
              single source of truth.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ["Realtime Dashboard", "Portfolio and cash metrics in one command center."],
                ["Secure by Default", "RLS policies and scoped access across all modules."],
                ["LP Reporting", "Reports, documents, and calls accessible in investor portal."],
                ["Automation Ready", "Workflow runs, notifications, and audit trails included."],
              ].map(([title, desc]) => (
                <article key={title} className="rounded-2xl border border-white/30 bg-white/16 p-3">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs text-white/80">{desc}</p>
                </article>
              ))}
            </div>
          </aside>

          <section className="ui-auth-form">
            <p className="ui-pill">Private Markets Intelligence</p>
            <h2 className="mt-4 text-[30px] leading-[1.1] font-semibold text-[color:var(--text-primary)]">Sign in</h2>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Use your Supabase Auth credentials.</p>

            {params.error ? (
              <p className="mt-4 rounded-[12px] border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
                {params.error}
              </p>
            ) : null}

            <form action={signIn} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="ui-label">Email</span>
                <input className="ui-input" name="email" type="email" required />
              </label>

              <label className="block text-sm">
                <span className="ui-label">Password</span>
                <input className="ui-input" name="password" type="password" required />
              </label>

              <SubmitButton loadingText="Signing in…" className="w-full">
                Continue to Dashboard
              </SubmitButton>
            </form>

            <p className="mt-6 text-sm text-[color:var(--text-secondary)]">
              <Link href="/" className="text-[color:var(--primary)] hover:text-[color:var(--primary-hover)]">
                Back to project overview
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
