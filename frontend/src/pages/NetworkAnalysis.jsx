import AppShell from "../components/AppShell";
import { useEffect, useState } from "react";

export default function NetworkAnalysis() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  useEffect(() => {
  fetch("http://HTTPS://CRIMENET-ANALYST.ONRENDER.COM/api/graph", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("crimenet_token")}`,
  },
})
      .then((res) => res.json())
      .then((data) => {
        setGraph({
          nodes: data.nodes || [],
          edges: data.edges || data.relationships || [],
        });
      })
      .catch((err) => console.error("Graph error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
  <AppShell>
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">04 · GRAPH</div>
          <h1>Network Analysis</h1>
          <p>
            Interactive view of entities and relationships across cases.
          </p>
        </div>
      </div>

      <div className="network-card">
        {loading ? (
          <p>Loading network...</p>
        ) : graph.nodes.length === 0 ? (
          <p>No network data available.</p>
        ) : (
          <div>
            <h2>Crime Network</h2>

            <div className="network-stats">
              <div>
                <strong>{graph.nodes.length}</strong>
                <span>Entities</span>
              </div>

              <div>
                <strong>{graph.edges.length}</strong>
                <span>Relationships</span>
              </div>
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
                height: "550px",
                background: "#0b1017",
                border: "1px solid #273142",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <svg
                viewBox="0 0 900 550"
                width="100%"
                height="100%"
              >
                {/* Relationship lines */}
                {graph.edges.map((edge, index) => {
                  const sourceId =
                    edge.source ??
                    edge.from ??
                    edge.entity_a_id;

                  const targetId =
                    edge.target ??
                    edge.to ??
                    edge.entity_b_id;

                  const sourceIndex = graph.nodes.findIndex(
                    (n) => String(n.id) === String(sourceId)
                  );

                  const targetIndex = graph.nodes.findIndex(
                    (n) => String(n.id) === String(targetId)
                  );

                  if (sourceIndex === -1 || targetIndex === -1) {
                    return null;
                  }

                  const angle1 =
                    (sourceIndex / graph.nodes.length) *
                    Math.PI *
                    2;

                  const angle2 =
                    (targetIndex / graph.nodes.length) *
                    Math.PI *
                    2;

                  const radius = 190;

                  const x1 =
                    450 + Math.cos(angle1) * radius;

                  const y1 =
                    275 + Math.sin(angle1) * radius;

                  const x2 =
                    450 + Math.cos(angle2) * radius;

                  const y2 =
                    275 + Math.sin(angle2) * radius;

                  return (
                    <line
                      key={index}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#475569"
                      strokeWidth="2"
                      opacity="0.7"
                    />
                  );
                })}

                {/* Entity nodes */}
                {graph.nodes.map((node, index) => {
                  const angle =
                    (index / graph.nodes.length) *
                    Math.PI *
                    2;

                  const radius = 190;

                  const x =
                    450 + Math.cos(angle) * radius;

                  const y =
                    275 + Math.sin(angle) * radius;

                  return (
                    <g
                      key={node.id || index}
                      onClick={() => setSelectedNode(node)}
                      style={{ cursor: "pointer" }}
                    >
                      

                      <circle
                        cx={x}
                        cy={y}
                        r="10"
                        fill="#f5a623"
                      />

                      <text
                        x={x + 18}
                        y={y + 4}
                        fill="#e5e7eb"
                        fontSize="12"
                      >
                        {(
                          node.name ||
                          node.label ||
                          `Entity ${index + 1}`
                        ).slice(0, 20)}
                      </text>

                      <text
                        x={x + 18}
                        y={y + 18}
                        fill="#94a3b8"
                        fontSize="9"
                      >
                        {node.type || "ENTITY"}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {selectedNode && (
                <div
                  style={{
                    position: "absolute",
                    left: "20px",
                    bottom: "20px",
                    background: "#111827",
                    border: "1px solid #273142",
                    borderRadius: "10px",
                    padding: "16px",
                    minWidth: "220px",
                    zIndex: 10,
                  }}
                >
                  <h3 style={{ margin: "0 0 10px" }}>
                    Selected Entity
                  </h3>

                  <div>
                    <strong>
                      {selectedNode.name ||
                        selectedNode.label ||
                        "Unknown"}
                    </strong>
                  </div>

                  <div
                    style={{
                      color: "#94a3b8",
                      marginTop: "6px",
                    }}
                  >
                    Type: {selectedNode.type || "ENTITY"}
                  </div>

                  <div
                    style={{
                      color: "#94a3b8",
                      marginTop: "4px",
                    }}
                  >
                    Mentions: {selectedNode.mention_count || 0}
                  </div>
                </div>
              )}
              
            </div>

            

            <div className="node-list">
              {graph.nodes.map((node, index) => (
                <div
                  className="node-item"
                  key={node.id || index}
                >
                  <strong>
                    {node.name ||
                      node.label ||
                      `Entity ${index + 1}`}
                  </strong>

                  <span>
                    {node.type || "ENTITY"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </AppShell>
);
}