"use client";

type ActionButton = {
  id: string;
  label: string;
  description: string;
  variant?: "primary" | "secondary";
  onClick: () => void;
};

export function ActionToolbar({ actions }: { actions: ActionButton[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Quick actions</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Launch workflows without leaving the dashboard.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className={`flex h-24 w-full flex-col justify-between rounded-xl border border-transparent px-5 py-4 text-left text-sm font-semibold transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
              action.variant === "primary"
                ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-2xl"
                : "bg-gradient-to-br from-white/95 to-slate-100 text-slate-900 shadow-lg ring-1 ring-slate-200 hover:-translate-y-0.5 hover:shadow-2xl dark:from-slate-900/80 dark:to-slate-800/90 dark:text-white dark:ring-slate-700"
            }`}
          >
            <span className="text-[11px] uppercase tracking-[0.25em] text-blue-400 dark:text-blue-200">{action.variant === "primary" ? "Primary" : "Action"}</span>
            <span className="text-lg leading-snug">{action.label}</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-300">{action.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
