import type { PropsWithChildren } from "react";
import type { Tone } from "@/lib/planner-view";

export function Badge({
  tone = "muted",
  children,
}: PropsWithChildren<{ tone?: Tone }>) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <article className="surface-card metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </article>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  className,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string; action?: React.ReactNode; className?: string }>) {
  return (
    <section className={`surface-card section-card${className ? ` ${className}` : ""}`}>
      <header className="section-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="progress-rail" aria-label={`Progreso ${safe}%`}>
      <span className="progress-fill" style={{ width: `${safe}%` }} />
    </div>
  );
}

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      <p className="empty-detail">{detail}</p>
    </div>
  );
}
