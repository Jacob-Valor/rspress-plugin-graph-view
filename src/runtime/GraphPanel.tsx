import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@rspress/core/runtime";
import GraphView from "./GraphView";

interface GraphPanelProps {
  defaultOpen?: boolean;
}

export default function GraphPanel({ defaultOpen = false }: GraphPanelProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [panelSize, setPanelSize] = useState({ width: 320, height: 240 });

  useEffect(() => {
    const updateSize = () => {
      const w = Math.min(400, window.innerWidth * 0.35);
      const h = Math.min(300, window.innerHeight * 0.35);
      setPanelSize({ width: w, height: h });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleNodeClick = useCallback((routePath: string) => {
    navigate(routePath);
  }, [navigate]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: "var(--rp-c-brand, #6366f1)",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        aria-label="Toggle graph view"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="5" cy="6" r="3" />
          <circle cx="19" cy="6" r="3" />
          <circle cx="12" cy="18" r="3" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="7" y1="8" x2="10" y2="16" />
          <line x1="17" y1="8" x2="14" y2="16" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            zIndex: 9998,
            width: panelSize.width,
            height: panelSize.height,
            borderRadius: 12,
            overflow: "hidden",
            background: "var(--rp-c-bg, #fff)",
            border: "1px solid var(--rp-c-divider, #e2e8f0)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          }}
        >
          <GraphView
            width={panelSize.width}
            height={panelSize.height}
            onNodeClick={handleNodeClick}
          />
        </div>
      )}
    </>
  );
}
