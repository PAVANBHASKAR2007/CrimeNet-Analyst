import AppShell from "../components/AppShell";
import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("crimenet_token");

      const response = await fetch(
        `https://crimenet-analyst.onrender.com/api/search?q=${encodeURIComponent(
          query.trim()
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
      setError("Unable to perform search.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">05 · LOOKUP</div>
            <h1>Search</h1>
            <p>
              Search people, phone numbers, organizations,
              locations, and case numbers.
            </p>
          </div>
        </div>

        <div className="network-card">
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "24px",
            }}
          >
            <input
              type="text"
              placeholder="Search person, phone, organization, location, case..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              style={{
                flex: 1,
                padding: "14px",
                background: "#0b1017",
                color: "#e5e7eb",
                border: "1px solid #273142",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />

            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: "14px 22px",
                background: "#f5a623",
                color: "#0b1017",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {error && (
            <p style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}

          {results && (
            <div>
              <h2>Search Results</h2>

              {results.entities?.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <h3>Entities</h3>

                  {results.entities.map((entity) => (
                    <div
                      key={entity.id}
                      style={{
                        padding: "14px",
                        marginTop: "10px",
                        background: "#111827",
                        border: "1px solid #273142",
                        borderRadius: "8px",
                      }}
                    >
                      <strong>{entity.name}</strong>

                      <div
                        style={{
                          color: "#94a3b8",
                          marginTop: "5px",
                        }}
                      >
                        Type: {entity.type || "ENTITY"}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.cases?.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <h3>Cases</h3>

                  {results.cases.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "14px",
                        marginTop: "10px",
                        background: "#111827",
                        border: "1px solid #273142",
                        borderRadius: "8px",
                      }}
                    >
                      <strong>
                        {item.case_number || "Case"}
                      </strong>

                      <div
                        style={{
                          color: "#94a3b8",
                          marginTop: "5px",
                        }}
                      >
                        {item.title || ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(!results.entities ||
                results.entities.length === 0) &&
                (!results.cases ||
                  results.cases.length === 0) && (
                  <p style={{ color: "#94a3b8" }}>
                    No results found.
                  </p>
                )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
