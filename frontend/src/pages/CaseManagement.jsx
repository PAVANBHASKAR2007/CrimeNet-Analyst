import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, Plus, Search, X, CheckCircle2, ChevronRight } from "lucide-react";
import AppShell from "../components/AppShell";
import { StatusBadge } from "../components/Badges";
import { TableSkeleton, ErrorPanel, EmptyState } from "../components/StatePanels";
import { getCases, createCase } from "../api/client";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "under_review", label: "Under Review" },
  { value: "closed", label: "Closed" },
];

export default function CaseManagement() {
  const [cases, setCases] = useState(null); // null = not loaded yet
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [successNote, setSuccessNote] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const navigate = useNavigate();

  function fetchCases() {
    setReloadToken((t) => t + 1);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    getCases()
      .then((data) => {
        if (!cancelled) setCases(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load cases. Check that the backend is running.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const filtered = useMemo(() => {
    if (!cases) return [];
    return cases.filter((c) => {
      const matchesQuery =
        !query.trim() ||
        c.case_number.toLowerCase().includes(query.trim().toLowerCase()) ||
        c.title.toLowerCase().includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [cases, query, statusFilter]);

  function handleCreated(newCase) {
    setCases((prev) => [newCase, ...(prev || [])]);
    setShowForm(false);
    setSuccessNote(`Case ${newCase.case_number} created.`);
    setTimeout(() => setSuccessNote(""), 4000);
  }

  return (
    <AppShell>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1">02 · Cases</div>
          <h1 className="text-2xl font-semibold">Case Management</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="font-mono text-xs tracking-widest uppercase px-4 py-2.5 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors flex items-center gap-2"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "New Case"}
        </button>
      </div>

      {successNote && (
        <div className="mb-4 flex items-center gap-2 text-teal text-sm border border-teal/40 bg-teal/10 rounded px-4 py-2.5">
          <CheckCircle2 size={16} />
          {successNote}
        </div>
      )}

      {showForm && (
        <CreateCaseForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
      )}

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by case number or title..."
            className="w-full bg-ink-800/50 border border-ink-600 rounded pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-ink-800/50 border border-ink-600 rounded px-3 py-2.5 text-sm font-mono uppercase tracking-wide focus:outline-none focus:border-amber transition-colors"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border border-ink-600 rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-ink-600 bg-ink-800/50 font-mono text-[10px] tracking-widest text-paper-500 uppercase">
          <div>Case Number</div>
          <div>Title</div>
          <div>Status</div>
          <div>Reports</div>
          <div>Entities</div>
          <div>Created</div>
        </div>

        {loading && <TableSkeleton rows={4} cols={6} />}

        {!loading && loadError && (
          <div className="p-6">
            <ErrorPanel message={loadError} onRetry={fetchCases} />
          </div>
        )}

        {!loading && !loadError && cases && cases.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={Folder}
              title="No cases yet"
              description="Create your first case to begin uploading reports and running analysis."
              action={
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-2 font-mono text-xs tracking-widest uppercase px-4 py-2 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors"
                >
                  Create your first case
                </button>
              }
            />
          </div>
        )}

        {!loading && !loadError && cases && cases.length > 0 && filtered.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={Search}
              title={`No cases match "${query || statusFilter}"`}
              description="Try a different search term or status filter."
            />
          </div>
        )}

        {!loading && !loadError && filtered.length > 0 && (
          <div className="divide-y divide-ink-600">
            {filtered.map((c) => (
              <CaseRow key={c.id} caseItem={c} onOpen={() => navigate(`/cases/${c.id}`)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function CaseRow({ caseItem: c, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="w-full grid grid-cols-6 gap-4 px-5 py-4 text-left text-sm hover:bg-ink-800/40 transition-colors items-center"
    >
      <div className="font-mono text-paper-100">{c.case_number}</div>
      <div className="text-paper-100 truncate">{c.title}</div>
      <div><StatusBadge status={c.status} /></div>
      <div className="font-mono text-paper-300">{c.report_count}</div>
      <div className="font-mono text-paper-300">{c.entity_count}</div>
      <div className="flex items-center justify-between">
        <span className="text-paper-500 text-xs">
          {new Date(c.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </span>
        <ChevronRight size={14} className="text-paper-500" />
      </div>
    </button>
  );
}

function CreateCaseForm({ onCreated, onCancel }) {
  const [caseNumber, setCaseNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs = {};
    if (!caseNumber.trim()) errs.case_number = "Case number is required.";
    if (!title.trim()) errs.title = "Title is required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await createCase({
        case_number: caseNumber.trim(),
        title: title.trim(),
        description: description.trim(),
      });
      onCreated(created);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 400 && detail) {
        // Duplicate case number (or other server-side validation) -> field-level error
        setFieldErrors((prev) => ({ ...prev, case_number: detail }));
      } else {
        setSubmitError("Could not create the case. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-ink-600 rounded-lg p-5 mb-6 bg-ink-800/30 space-y-4"
    >
      <div className="font-mono text-[10px] tracking-widest text-paper-500 uppercase">New Case</div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1.5">
            Case Number *
          </label>
          <input
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="FIR-2026-XXXX"
            className={`w-full bg-ink-900 border rounded px-3 py-2.5 text-sm focus:outline-none transition-colors ${
              fieldErrors.case_number ? "border-clay" : "border-ink-600 focus:border-amber"
            }`}
          />
          {fieldErrors.case_number && (
            <div className="text-clay text-xs mt-1.5">{fieldErrors.case_number}</div>
          )}
        </div>

        <div>
          <label className="block font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1.5">
            Title *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short case title"
            className={`w-full bg-ink-900 border rounded px-3 py-2.5 text-sm focus:outline-none transition-colors ${
              fieldErrors.title ? "border-clay" : "border-ink-600 focus:border-amber"
            }`}
          />
          {fieldErrors.title && <div className="text-clay text-xs mt-1.5">{fieldErrors.title}</div>}
        </div>
      </div>

      <div>
        <label className="block font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1.5">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Brief summary of the case..."
          className="w-full bg-ink-900 border border-ink-600 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors resize-none"
        />
      </div>

      {submitError && <div className="text-clay text-sm">{submitError}</div>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="font-mono text-xs tracking-widest uppercase px-5 py-2.5 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating..." : "Create Case"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-xs tracking-widest uppercase px-5 py-2.5 border border-ink-600 rounded hover:border-paper-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
