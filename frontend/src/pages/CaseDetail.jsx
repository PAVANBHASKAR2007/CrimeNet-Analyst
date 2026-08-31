import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, FileText, UploadCloud, Share2, User, Calendar, FolderX,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { EntityTypeBadge, StatusBadge, SeverityStamp } from "../components/Badges";
import { ErrorPanel, EmptyState } from "../components/StatePanels";
import { getCase, getCaseReports, getEntities, getInsights } from "../api/client";

export default function CaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const [reports, setReports] = useState(null);
  const [reportsError, setReportsError] = useState("");
  const [entities, setEntities] = useState(null);
  const [entitiesError, setEntitiesError] = useState("");
  const [insights, setInsights] = useState(null);
  const [insightsError, setInsightsError] = useState("");

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setLoadError("");

      let loadedCase;
      try {
        loadedCase = await getCase(caseId);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setLoadError("Could not load this case. Check that the backend is running.");
        }
        setLoading(false);
        return;
      }
      if (cancelled) return;
      setCaseData(loadedCase);
      setLoading(false);

      // Secondary sections load independently so one failing doesn't block the others.
      getCaseReports(caseId)
        .then((data) => !cancelled && setReports(data))
        .catch(() => !cancelled && setReportsError("Could not load reports for this case."));

      getEntities({ case_id: caseId })
        .then((data) => !cancelled && setEntities(data))
        .catch(() => !cancelled && setEntitiesError("Could not load extracted entities."));

      getInsights({ case_id: caseId })
        .then((data) => !cancelled && setInsights(data))
        .catch(() => !cancelled && setInsightsError("Could not load related insights."));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [caseId, reloadToken]);

  function retry() {
    setReloadToken((t) => t + 1);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-4 w-40 bg-ink-600 rounded animate-pulse" />
          <div className="h-8 w-96 bg-ink-600 rounded animate-pulse" />
          <div className="h-32 w-full bg-ink-600 rounded animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (notFound) {
    return (
      <AppShell>
        <BackLink />
        <EmptyState
          icon={FolderX}
          title="Case not found"
          description={`No case exists with ID "${caseId}". It may have been removed, or the link may be incorrect.`}
          action={
            <button
              onClick={() => navigate("/cases")}
              className="mt-2 font-mono text-xs tracking-widest uppercase px-4 py-2 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors"
            >
              Back to Case Management
            </button>
          }
        />
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <BackLink />
        <ErrorPanel message={loadError} onRetry={retry} />
      </AppShell>
    );
  }

  const c = caseData;

  return (
    <AppShell>
      <BackLink />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-lg text-paper-100">{c.case_number}</span>
          <StatusBadge status={c.status} />
        </div>
        <h1 className="text-2xl font-semibold mb-3">{c.title}</h1>
        <p className="text-paper-300 text-sm max-w-2xl leading-relaxed mb-4">
          {c.description || <span className="text-paper-500 italic">No description provided.</span>}
        </p>
        <div className="flex items-center gap-6 font-mono text-[11px] text-paper-500 uppercase tracking-wide">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {new Date(c.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          </span>
          <span className="flex items-center gap-1.5">
            <User size={12} />
            {c.uploaded_by ? c.uploaded_by : "Investigator not recorded"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(`/upload?case_id=${c.id}`)}
          className="font-mono text-xs tracking-widest uppercase px-4 py-2.5 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors flex items-center gap-2"
        >
          <UploadCloud size={14} />
          Upload Another Report
        </button>
        <button
          onClick={() => navigate(`/network?case_id=${c.id}`)}
          className="font-mono text-xs tracking-widest uppercase px-4 py-2.5 border border-ink-600 rounded hover:border-teal hover:text-teal transition-colors flex items-center gap-2"
        >
          <Share2 size={14} />
          View in Network Analysis
        </button>
      </div>

      {/* Reports */}
      <Section title="Uploaded Reports" eyebrow="Source documents">
        {reportsError && <ErrorPanel message={reportsError} onRetry={retry} />}
        {!reportsError && reports === null && <SkeletonBlock />}
        {!reportsError && reports && reports.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No reports uploaded to this case yet"
            description="Upload a case report to begin entity extraction and analysis."
            action={
              <button
                onClick={() => navigate(`/upload?case_id=${c.id}`)}
                className="mt-2 font-mono text-xs tracking-widest uppercase px-4 py-2 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors"
              >
                Upload a Report
              </button>
            }
          />
        )}
        {!reportsError && reports && reports.length > 0 && (
          <div className="border border-ink-600 rounded-lg divide-y divide-ink-600 overflow-hidden">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <FileText size={15} className="text-paper-500" />
                  <span className="text-sm text-paper-100">{r.filename}</span>
                </div>
                <div className="flex items-center gap-6 font-mono text-xs text-paper-500">
                  <span>{r.entity_count} {r.entity_count === 1 ? "entity" : "entities"}</span>
                  <span>{new Date(r.uploaded_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Entities grouped by type */}
      <Section title="Extracted Entities" eyebrow="From this case's reports">
        {entitiesError && <ErrorPanel message={entitiesError} onRetry={retry} />}
        {!entitiesError && entities === null && <SkeletonBlock />}
        {!entitiesError && entities && entities.length === 0 && reports && reports.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No entities to show yet"
            description="Entities appear here automatically once a report is uploaded to this case."
          />
        )}
        {!entitiesError && entities && entities.length === 0 && reports && reports.length > 0 && (
          <EmptyState
            icon={FileText}
            title="No recognizable entities were found in this case's reports"
            description="This can happen with very short reports or non-standard formatting."
          />
        )}
        {!entitiesError && entities && entities.length > 0 && (
          <EntityGroups entities={entities} />
        )}
      </Section>

      {/* Cross-case insights */}
      <Section title="Cross-Case Insights" eyebrow="Patterns involving this case">
        {insightsError && <ErrorPanel message={insightsError} onRetry={retry} />}
        {!insightsError && insights === null && <SkeletonBlock />}
        {!insightsError && insights && insights.length === 0 && (
          <EmptyState
            icon={Share2}
            title="No cross-case insights yet"
            description="Insights appear here when entities in this case also appear in other cases."
          />
        )}
        {!insightsError && insights && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((i) => (
              <div key={i.id} className="border border-ink-600 rounded-lg p-4 flex items-start gap-4 bg-ink-800/20">
                <SeverityStamp severity={i.severity} />
                <div>
                  <div className="font-mono text-[10px] text-paper-500 uppercase tracking-wide mb-1">
                    {i.type.replace(/_/g, " ")}
                  </div>
                  <div className="text-sm text-paper-100">{i.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </AppShell>
  );
}

function BackLink() {
  return (
    <Link
      to="/cases"
      className="inline-flex items-center gap-1.5 text-paper-500 hover:text-paper-100 transition-colors text-sm mb-6"
    >
      <ArrowLeft size={14} />
      Back to Case Management
    </Link>
  );
}

function Section({ title, eyebrow, children }) {
  return (
    <div className="mb-10">
      <div className="mb-3">
        <div className="font-mono text-[10px] tracking-widest text-paper-500 uppercase">{eyebrow}</div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SkeletonBlock() {
  return <div className="h-20 w-full bg-ink-600 rounded animate-pulse" />;
}

function EntityGroups({ entities }) {
  const grouped = {};
  for (const e of entities) {
    if (!grouped[e.entity_type]) grouped[e.entity_type] = [];
    grouped[e.entity_type].push(e);
  }
  const types = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {types.map((type) => (
        <div key={type}>
          <div className="mb-2"><EntityTypeBadge type={type} /></div>
          <div className="flex flex-wrap gap-2">
            {grouped[type].map((e) => (
              <span
                key={e.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-ink-600 bg-ink-800/40 text-sm text-paper-100"
              >
                {e.name}
                <span className="font-mono text-[10px] text-paper-500">×{e.mention_count}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
