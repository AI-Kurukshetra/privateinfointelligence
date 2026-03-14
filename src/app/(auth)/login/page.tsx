import Link from "next/link";

import { signIn } from "@/app/(auth)/login/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="ui-shell flex min-h-screen items-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="ui-card">
          <p className="ui-pill">Private Markets Intelligence</p>
          <h1 className="mt-4 text-[28px] font-semibold text-[color:var(--text-primary)]">Sign in</h1>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Use your Supabase Auth credentials.</p>

          {params.error ? (
            <p className="mt-4 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
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

            <button type="submit" className="ui-btn ui-btn-primary w-full">
              Continue
            </button>
          </form>

          <p className="mt-6 text-sm text-[color:var(--text-secondary)]">
            <Link href="/" className="text-[color:var(--primary)] hover:text-[color:var(--primary-hover)]">
              Back to project overview
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
