"use client";

type OverviewCardProps = {
  label: string;
  value: string;
  helper?: string;
  trend?: { label: string; positive?: boolean };
  icon?: React.ReactNode;
};

export function OverviewCard({ label, value, helper, trend, icon }: OverviewCardProps) {
  return (
    <article className="group relative rounded-[20px] border border-white/10 bg-white/80 px-6 py-5 shadow-[0_30px_45px_rgba(15,23,42,0.25)] backdrop-blur-xl transition hover:border-blue-400/60 dark:border-white/5 dark:bg-slate-900/80">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
        {icon ? <div className="text-slate-400">{icon}</div> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
        {helper ? <span>{helper}</span> : <span className="invisible">helper</span>}
        {trend ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              trend.positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {trend.label}
          </span>
        ) : null}
      </div>
    </article>
  );
}
