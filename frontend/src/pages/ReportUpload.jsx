import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  UploadCloud, FileText, X, CheckCircle2, AlertCircle, ArrowRight, Folder,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { EntityTypeBadge } from "../components/Badges";
import { ErrorPanel, EmptyState } from "../components/StatePanels";
import { getCases, uploadReport } from "../api/client";

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".csv"];
const MAX_BYTES = 10 * 1024 * 1024;

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReportUpload() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCaseId = searchParams.get("case_id");

  const [cases, setCases] = useState(null);
  const [casesError, setCasesError] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState(preselectedCaseId || "");

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

  // phase: 'idle' | 'uploading' | 'analyzing' | 'success' | 'error'
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setCasesError("");
    getCases()
      .then((data) => !cancelled && setCases(data))
      .catch(() => !cancelled && setCasesError("Could not load the case list. Check that the backend is running."));
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const selectedCase = useMemo(
    () => cases?.find((c) => String(c.id) === String(selectedCaseId)),
    [cases, selectedCaseId]
  );

  function validateAndSetFile(f) {
    setFileError("");
    if (!f) return;
    const ext = getExtension(f.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`Unsupported file type "${ext || "unknown"}". Only .pdf, .txt, and .csv files are supported.`);
      setFile(null);
      return;
    }
    if (f.size === 0) {
      setFileError("This file is empty.");
      setFile(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setFileError("File is too large. Maximum size is 10MB.");
      setFile(null);
      return;
    }
    setFile(f);
  }

  function handleFileInputChange(e) {
    validateAndSetFile(e.target.files?.[0] || null);
  }

  function handleDrop(e) {
    e.preventDefault();
    validateAndSetFile(e.dataTransfer.files?.[0] || null);
  }

  function removeFile() {
    setFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyze() {
    if (!selectedCaseId || !file) return;
    setPhase("uploading");
    setProgress(0);
    setErrorMessage("");
    setResult(null);

    try {
      const data = await uploadReport(selectedCaseId, file, (pct) => {
        setProgress(pct);
        if (pct >= 100) setPhase("analyzing");
      });
      setResult(data);
      setPhase("success");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMessage(typeof detail === "string" ? detail : "Something went wrong while analyzing this report. Please try again.");
      setPhase("error");
    }
  }

  function resetForUploadAnother() {
    setFile(null);
    setFileError("");
    setPhase("idle");
    setProgress(0);
    setErrorMessage("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const busy = phase === "uploading" || phase === "analyzing";

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1">03 · Reports</div>
        <h1 className="text-2xl font-semibold">Report Upload</h1>
      </div>

      {phase === "success" && result ? (
        <ResultsPanel
          result={result}
          selectedCase={selectedCase}
          onUploadAnother={resetForUploadAnother}
          onViewCase={() => navigate(`/cases/${selectedCaseId}`)}
        />
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Case selector */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1.5">
              Case *
            </label>
            {casesError ? (
              <ErrorPanel message={casesError} onRetry={() => setReloadToken((t) => t + 1)} />
            ) : cases === null ? (
              <div className="h-11 bg-ink-600 rounded animate-pulse" />
            ) : cases.length === 0 ? (
              <EmptyState
                icon={Folder}
                title="No cases exist yet"
                description="Create a case before uploading a report."
                action={
                  <Link
                    to="/cases"
                    className="mt-2 inline-block font-mono text-xs tracking-widest uppercase px-4 py-2 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors"
                  >
                    Go to Case Management
                  </Link>
                }
              />
            ) : (
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                disabled={busy}
                className="w-full bg-ink-900 border border-ink-600 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors disabled:opacity-50"
              >
                <option value="">Select a case...</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} — {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* File drop zone */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1.5">
              Report File *
            </label>

            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !busy && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center text-center gap-2 transition-colors ${
                  busy ? "border-ink-600 opacity-50" : "border-ink-600 hover:border-amber/50 cursor-pointer"
                }`}
              >
                <UploadCloud size={22} className="text-paper-500" />
                <div className="text-sm text-paper-300">
                  <span className="text-amber font-medium">Click to browse</span> or drag a file here
                </div>
                <div className="font-mono text-[10px] text-paper-500 uppercase tracking-wide">
                  PDF, TXT, or CSV — up to 10MB
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.csv"
                  onChange={handleFileInputChange}
                  disabled={busy}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-ink-600 rounded-lg p-4 flex items-center justify-between bg-ink-800/30">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} className="text-amber shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-paper-100 truncate">{file.name}</div>
                    <div className="font-mono text-[10px] text-paper-500">{formatBytes(file.size)}</div>
                  </div>
                </div>
                {!busy && (
                  <button
                    onClick={removeFile}
                    className="text-paper-500 hover:text-clay transition-colors p-1 shrink-0"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {fileError && (
              <div className="mt-2 flex items-center gap-2 text-clay text-xs border border-clay/40 bg-clay/10 rounded px-3 py-2">
                <AlertCircle size={13} />
                {fileError}
              </div>
            )}
          </div>

          {/* Upload progress / analyzing state */}
          {phase === "uploading" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] tracking-widest text-paper-500 uppercase">Uploading report...</span>
                <span className="font-mono text-[10px] text-paper-500">{progress}%</span>
              </div>
              <div className="h-1.5 bg-ink-600 rounded-full overflow-hidden">
                <div className="h-full bg-amber transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {phase === "analyzing" && (
            <div className="flex items-center gap-2 text-amber text-sm">
              <span className="w-3.5 h-3.5 border-2 border-amber border-t-transparent rounded-full animate-spin" />
              Extracting entities...
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="flex items-start gap-2 text-clay text-sm border border-clay/40 bg-clay/10 rounded px-4 py-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleAnalyze}
            disabled={!selectedCaseId || !file || busy}
            className="font-mono text-xs tracking-widest uppercase px-6 py-3 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {busy ? (phase === "uploading" ? "Uploading..." : "Analyzing...") : "Analyze Report"}
            {!busy && <ArrowRight size={14} />}
          </button>
        </div>
      )}
    </AppShell>
  );
}

function ResultsPanel({ result, selectedCase, onUploadAnother, onViewCase }) {
  const byType = result.by_type || {};
  const types = Object.keys(byType).sort();
  const uniqueCounts = {};
  for (const t of types) {
    uniqueCounts[t] = new Set(byType[t]).size;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-teal text-sm border border-teal/40 bg-teal/10 rounded px-4 py-3 mb-6">
        <CheckCircle2 size={16} />
        Report analyzed successfully
        {selectedCase && <span className="text-paper-300">— added to {selectedCase.case_number}</span>}
      </div>

      <div className="border border-ink-600 rounded-lg p-6 mb-6 bg-ink-800/30">
        <div className="flex items-center gap-3 mb-1">
          <FileText size={16} className="text-paper-500" />
          <span className="text-sm text-paper-100">{result.filename}</span>
        </div>
        <div className="text-3xl font-semibold font-mono mt-3">{result.entities_found}</div>
        <div className="text-paper-500 text-xs">entities found in this report</div>
      </div>

      {types.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No recognizable entities were found in this report"
          description="This can happen with very short reports or non-standard formatting."
        />
      ) : (
        <div className="space-y-4 mb-8">
          {types.map((t) => (
            <div key={t}>
              <div className="mb-2 flex items-center gap-2">
                <EntityTypeBadge type={t} />
                <span className="font-mono text-[10px] text-paper-500">{uniqueCounts[t]} unique</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[...new Set(byType[t])].map((name) => (
                  <span
                    key={name}
                    className="px-3 py-1.5 rounded border border-ink-600 bg-ink-800/40 text-sm text-paper-100"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onViewCase}
          className="font-mono text-xs tracking-widest uppercase px-5 py-2.5 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors"
        >
          View Case
        </button>
        <button
          onClick={onUploadAnother}
          className="font-mono text-xs tracking-widest uppercase px-5 py-2.5 border border-ink-600 rounded hover:border-paper-500 transition-colors"
        >
          Upload Another Report
        </button>
      </div>
    </div>
  );
}
