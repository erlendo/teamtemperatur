import Link from "next/link";

interface HealthCardProps {
  teamId: string;
  currentWeek: number;
  overallAvg: number;
  responseRate: number;
  responseCount: number;
  memberCount: number;
  previousWeekAvg?: number;
}

export function HealthCard({
  teamId,
  currentWeek,
  overallAvg,
  responseRate,
  responseCount,
  memberCount,
  previousWeekAvg,
}: HealthCardProps) {
  const getTrendIcon = () => {
    if (!previousWeekAvg) return "→";
    const diff = overallAvg - previousWeekAvg;
    if (diff > 0.2) return "↗️";
    if (diff < -0.2) return "↘️";
    return "→";
  };

  const getTrendText = () => {
    if (!previousWeekAvg) return "";
    const diff = overallAvg - previousWeekAvg;
    if (Math.abs(diff) < 0.1) return "";
    return diff > 0
      ? `+${diff.toFixed(1)} fra forrige uke`
      : `${diff.toFixed(1)} fra forrige uke`;
  };

  const getHealthColor = () => {
    if (overallAvg >= 4.0) return "var(--color-success, #22c55e)";
    if (overallAvg >= 3.0) return "var(--color-warning, #eab308)";
    return "var(--color-error, #ef4444)";
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "var(--radius-lg, 0.5rem)",
        padding: "var(--space-lg)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--color-neutral-200, #e5e5e5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "var(--font-size-sm, 0.875rem)",
          fontWeight: 600,
          color: "var(--color-neutral-600)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Denne uka (Uke {currentWeek})
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "var(--space-sm)",
        }}
      >
        <span
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: getHealthColor(),
          }}
        >
          ● {overallAvg.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: "var(--font-size-lg)",
            color: "var(--color-neutral-500)",
          }}
        >
          / 5.0
        </span>
        {previousWeekAvg && (
          <span
            style={{
              fontSize: "var(--font-size-lg)",
              marginLeft: "auto",
            }}
          >
            {getTrendIcon()}
          </span>
        )}
      </div>

      {getTrendText() && (
        <p
          style={{
            margin: 0,
            fontSize: "var(--font-size-sm)",
            color: "var(--color-neutral-600)",
          }}
        >
          {getTrendText()}
        </p>
      )}

      <div
        style={{
          padding: "var(--space-md)",
          backgroundColor: "var(--color-neutral-50, #fafafa)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--font-size-sm)",
            color: "var(--color-neutral-700)",
          }}
        >
          <strong>Svarrate:</strong> {responseCount}/{memberCount} (
          {responseRate.toFixed(0)}%)
        </p>
      </div>

      <Link
        href={`/t/${teamId}/stats`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-xs)",
          color: "var(--color-primary, #3b82f6)",
          textDecoration: "none",
          fontSize: "var(--font-size-sm)",
          fontWeight: 500,
        }}
      >
        Se detaljert statistikk →
      </Link>
    </div>
  );
}
