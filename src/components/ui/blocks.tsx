import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  right?: ReactNode;
};

export function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  return (
    <header className="ui-page-header">
      <div>
        <h1 className="ui-page-title">{title}</h1>
        <p className="ui-page-subtitle mt-1">{subtitle}</p>
      </div>
      {right}
    </header>
  );
}

type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <section className="ui-card ui-section-card space-y-4">
      <div>
        <h2 className="ui-section-title">{title}</h2>
        {subtitle ? <p className="ui-section-subtitle">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  helpText: string;
};

export function MetricCard({ label, value, helpText }: MetricCardProps) {
  return (
    <article className="ui-card ui-metric-card">
      <p className="text-[12px] font-medium tracking-wide text-[color:var(--text-secondary)] uppercase">{label}</p>
      <p className="ui-metric-value mt-2">{value}</p>
      <p className="ui-muted mt-2">{helpText}</p>
    </article>
  );
}
