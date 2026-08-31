import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Folder, UploadCloud, Share2, Search, AlertTriangle, LogOut, ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid, num: "01" },
  { to: "/cases", label: "Case Management", icon: Folder, num: "02" },
  { to: "/upload", label: "Report Upload", icon: UploadCloud, num: "03" },
  { to: "/network", label: "Network Analysis", icon: Share2, num: "04" },
  { to: "/search", label: "Search", icon: Search, num: "05" },
  { to: "/insights", label: "Investigation Insights", icon: AlertTriangle, num: "06" },
];

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("crimenet_user") || "investigator";

  function logout() {
    localStorage.removeItem("crimenet_token");
    localStorage.removeItem("crimenet_user");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-ink-900 text-paper-100 flex">
      <aside className="w-64 shrink-0 border-r border-ink-600 bg-ink-950 flex flex-col">
        <div className="px-5 py-6 border-b border-ink-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border border-amber/60 flex items-center justify-center">
              <ShieldCheck size={16} className="text-amber" />
            </div>
            <div>
              <div className="font-mono text-sm tracking-widest text-paper-100">CRIMENET</div>
              <div className="font-mono text-[10px] tracking-widest text-paper-500">SIH26189 · ANALYST</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm border-l-2 transition-colors ${
                  isActive
                    ? "border-amber bg-ink-800 text-paper-100"
                    : "border-transparent text-paper-500 hover:text-paper-100 hover:bg-ink-800/50"
                }`
              }
            >
              <span className="font-mono text-[10px] text-paper-500 w-4">{item.num}</span>
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-ink-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-paper-300 font-medium capitalize">{username}</div>
              <div className="font-mono text-[10px] text-paper-500 tracking-wide">AUTHORIZED · INVESTIGATOR</div>
            </div>
            <button
              onClick={logout}
              className="text-paper-500 hover:text-clay transition-colors p-1.5 rounded hover:bg-ink-800"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
