const TYPE_STYLES = {
  PERSON: "text-amber border-amber/40 bg-amber/10",
  ORG: "text-teal border-teal/40 bg-teal/10",
  LOCATION: "text-paper-100 border-paper-500/40 bg-paper-500/10",
  PHONE: "text-clay border-clay/40 bg-clay/10",
  ACCOUNT: "text-clay border-clay/40 bg-clay/10",
  VEHICLE: "text-teal border-teal/40 bg-teal/10",
  EMAIL: "text-clay border-clay/40 bg-clay/10",
};

export function EntityTypeBadge({ type }) {
  const cls = TYPE_STYLES[type] || "text-paper-300 border-paper-500/40 bg-paper-500/10";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border font-mono text-[10px] tracking-widest uppercase ${cls}`}>
      {type}
    </span>
  );
}

const SEVERITY_STYLES = {
  high: "text-clay border-clay",
  medium: "text-amber border-amber",
  low: "text-teal border-teal",
};

export function SeverityStamp({ severity }) {
  const cls = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium;
  return (
    <span
      className={`inline-block px-2 py-1 rounded border-2 font-mono text-[10px] tracking-widest uppercase -rotate-2 ${cls}`}
      style={{ borderStyle: "solid" }}
    >
      {severity}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    open: "text-teal border-teal/40 bg-teal/10",
    under_review: "text-amber border-amber/40 bg-amber/10",
    closed: "text-paper-500 border-paper-500/40 bg-paper-500/10",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border font-mono text-[10px] tracking-widest uppercase ${styles[status] || styles.open}`}>
      {(status || "open").replace("_", " ")}
    </span>
  );
}
