import AppShell from "../components/AppShell";
import { useEffect, useState } from "react";

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("http://HTTPS://CRIMENET-ANALYST.ONRENDER.COM/api/insights", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("crimenet_token")}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load insights");
        }
        return res.json();
      })
      .then((data) => {
        setInsights(data || []);
      })
      .catch((err) => {
        console.error("Insights error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleReviewed = async (id) => {
    try {
      const response = await fetch(
        `http://HTTPS://CRIMENET-ANALYST.ONRENDER.COM/api/insights/${id}/review`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "crimenet_token"
            )}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update review status");
      }

      const data = await response.json();

      setInsights((current) =>
        current.map((insight) =>
          insight.id === id
            ? { ...insight, reviewed: data.reviewed }
            : insight
        )
      );
    } catch (err) {
      console.error("Review error:", err);
    }
  };

  const filteredInsights = insights.filter((insight) => {
    if (filter === "reviewed") return insight.reviewed;
    if (filter === "unreviewed") return !insight.reviewed;
    return true;
  });

  return (
    <AppShell>
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">06 · REVIEW</div>

            <h1>Investigation Insights</h1>

            <p>
              Repeated entities, cross-case links, and important
              investigative findings.
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
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #273142",
                background:
                  filter === "all" ? "#f5a623" : "#111827",
                color:
                  filter === "all" ? "#0b1017" : "#e5e7eb",
                cursor: "pointer",
              }}
            >
              All
            </button>

            <button
              onClick={() => setFilter("unreviewed")}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #273142",
                background:
                  filter === "unreviewed"
                    ? "#f5a623"
                    : "#111827",
                color:
                  filter === "unreviewed"
                    ? "#0b1017"
                    : "#e5e7eb",
                cursor: "pointer",
              }}
            >
              Unreviewed
            </button>

            <button
              onClick={() => setFilter("reviewed")}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #273142",
                background:
                  filter === "reviewed"
                    ? "#f5a623"
                    : "#111827",
                color:
                  filter === "reviewed"
                    ? "#f5a623"
                    : "#e5e7eb",
                cursor: "pointer",
              }}
            >
              Reviewed
            </button>
          </div>

          {loading ? (
            <p>Loading insights...</p>
          ) : filteredInsights.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>
              No insights available.
            </p>
          ) : (
            <div>
              {filteredInsights.map((insight) => (
                <div
                  key={insight.id}
                  style={{
                    background: "#111827",
                    border: "1px solid #273142",
                    borderRadius: "10px",
                    padding: "18px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "20px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#f5a623",
                          fontSize: "12px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        {insight.type}
                      </div>

                      <h3 style={{ margin: "8px 0" }}>
                        Insight #{insight.id}
                      </h3>

                      <p
                        style={{
                          color: "#e5e7eb",
                          lineHeight: "1.6",
                          margin: "0",
                        }}
                      >
                        {insight.description}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background:
                          insight.severity >= 4
                            ? "#7f1d1d"
                            : "#374151",
                        color: "#fff",
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Severity {insight.severity}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      color: "#94a3b8",
                      fontSize: "13px",
                    }}
                  >
                    <div>
                      Related Entities:{" "}
                      {insight.related_entity_ids?.length || 0}
                    </div>

                    <div style={{ marginTop: "5px" }}>
                      Related Cases:{" "}
                      {insight.related_case_ids?.length || 0}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      toggleReviewed(insight.id)
                    }
                    style={{
                      marginTop: "16px",
                      padding: "9px 14px",
                      borderRadius: "7px",
                      border: "1px solid #273142",
                      background: insight.reviewed
                        ? "#1f2937"
                        : "#f5a623",
                      color: insight.reviewed
                        ? "#e5e7eb"
                        : "#0b1017",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {insight.reviewed
                      ? "✓ Reviewed"
                      : "Mark as Reviewed"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
