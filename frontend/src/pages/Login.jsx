import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { login } from "../api/client";

export default function Login() {
  const [username, setUsername] = useState("investigator");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      localStorage.setItem("crimenet_token", data.token);
      localStorage.setItem("crimenet_user", data.full_name || data.username);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 text-paper-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded border border-amber/60 flex items-center justify-center">
            <ShieldCheck size={18} className="text-amber" />
          </div>
          <span className="font-mono text-sm tracking-widest">CRIMENET</span>
        </div>

        <div className="border border-ink-600 rounded-lg p-8 bg-ink-800/50">
          <div className="font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1">Restricted access</div>
          <h1 className="text-xl font-semibold mb-6">Investigator Login</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1.5">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-ink-900 border border-ink-600 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ink-900 border border-ink-600 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
                required
              />
            </div>

            {error && (
              <div className="text-clay text-xs font-mono border border-clay/40 bg-clay/10 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-mono text-xs tracking-widest uppercase py-3 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-ink-600 font-mono text-[10px] text-paper-500 leading-relaxed">
            DEMO CREDENTIALS<br />
            username: investigator<br />
            password: sih2026
          </div>
        </div>
      </div>
    </div>
  );
}
