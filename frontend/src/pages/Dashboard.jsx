import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Folder, Users, Share2, AlertTriangle } from "lucide-react";
import AppShell from "../components/AppShell";
import { SeverityStamp } from "../components/Badges";
import { getDashboardStats } from "../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError("Could not load dashboard data."));
  }, []);

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1">Overview</div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      {error && <div className="text-clay text-sm">{error}</div>}

      {stats && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard icon={Folder} label="Total Cases" value={stats.total_cases} />
            <StatCard icon={Users} label="Entities Extracted" value={stats.total_entities} />
            <StatCard icon={Share2} label="Relationships" value={stats.total_relationships} />
            <StatCard
              icon={AlertTriangle}
              label="Unreviewed Insights"
              value={stats.unreviewed_insights}
              accent
            />
          </div>

          <div className="border border-ink-600 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-ink-600 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-paper-500 uppercase">Latest</div>
                <h2 className="font-semibold">Recent Investigation Insights</h2>
              </div>
              <Link to="/insights" className="font-mono text-xs text-amber hover:underline">
                View all →
              </Link>
            </div>
            {stats.recent_insights.length === 0 ? (
              <div className="px-5 py-8 text-center text-paper-500 text-sm">
                No insights yet. Upload case reports to begin analysis.
              </div>
            ) : (
              <div className="divide-y divide-ink-600">
                {stats.recent_insights.map((i) => (
                  <div key={i.id} className="px-5 py-4 flex items-center gap-4">
                    <SeverityStamp severity={i.severity} />
                    <div className="flex-1">
                      <div className="font-mono text-[10px] text-paper-500 uppercase tracking-wide mb-0.5">
                        {i.type.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm text-paper-100">{i.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <QuickAction to="/upload" title="Upload a Report" desc="Add a new case report and run entity extraction" />
            <QuickAction to="/network" title="Explore the Network" desc="View the full interactive connection graph" />
            <QuickAction to="/search" title="Search" desc="Look up a person, phone number, location or case" />
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="border border-ink-600 rounded-lg p-5 bg-ink-800/30">
      <Icon size={16} className={accent ? "text-clay mb-3" : "text-amber mb-3"} />
      <div className="text-2xl font-semibold font-mono">{value ?? "—"}</div>
      <div className="text-paper-500 text-xs mt-1">{label}</div>
    </div>
  );
}

function QuickAction({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="border border-ink-600 rounded-lg p-5 hover:border-amber/40 transition-colors block"
    >
      <div className="font-semibold text-sm mb-1">{title}</div>
      <div className="text-paper-500 text-xs">{desc}</div>
    </Link>
  );
}
