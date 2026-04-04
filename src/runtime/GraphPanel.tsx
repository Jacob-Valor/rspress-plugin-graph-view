import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "@rspress/core/runtime";
import GraphView from "./GraphView";

interface GraphPanelProps {
  defaultOpen?: boolean;
}

const STYLE_ID = "graph-panel-keyframes";

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes gv-fab-pulse {
      0%, 100% { box-shadow: 0 2px 16px rgba(99,102,241,0.35), 0 0 0 0 rgba(99,102,241,0.3); }
      50% { box-shadow: 0 4px 20px rgba(99,102,241,0.5), 0 0 0 6px rgba(99,102,241,0); }
    }
    @keyframes gv-panel-enter {
      from { opacity: 0; transform: scale(0.92) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes gv-fab-spin-in {
      from { transform: rotate(-90deg) scale(0.8); opacity: 0; }
      to { transform: rotate(0deg) scale(1); opacity: 1; }
    }
    @keyframes gv-accent-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}

export default function GraphPanel({ defaultOpen = false }: GraphPanelProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [panelSize, setPanelSize] = useState({ width: 320, height: 240 });
  const [panelVisible, setPanelVisible] = useState(defaultOpen);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectKeyframes();
  }, []);

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

  useEffect(() => {
    if (isOpen) {
      setPanelVisible(true);
    } else {
      const timer = setTimeout(() => setPanelVisible(false), 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleNodeClick = useCallback(
    (routePath: string) => {
      navigate(routePath);
    },
    [navigate],
  );

  const headerHeight = 36;
  const graphHeight = panelSize.height - headerHeight;

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%)",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "gv-fab-pulse 3s ease-in-out infinite",
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.12)";
          e.currentTarget.style.animationPlayState = "paused";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.animationPlayState = "running";
        }}
        aria-label="Toggle graph view"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            animation: isOpen ? "none" : "gv-fab-spin-in 0.4s ease-out",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
          }}
        >
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <circle cx="5" cy="6" r="2.5" />
              <circle cx="19" cy="6" r="2.5" />
              <circle cx="12" cy="18" r="2.5" />
              <line x1="7.5" y1="6" x2="16.5" y2="6" />
              <line x1="6.5" y1="8" x2="10.5" y2="16" />
              <line x1="17.5" y1="8" x2="13.5" y2="16" />
            </>
          )}
        </svg>
      </button>

      {/* Panel */}
      {panelVisible && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            zIndex: 9998,
            width: panelSize.width,
            height: panelSize.height,
            borderRadius: 14,
            overflow: "hidden",
            background: "color-mix(in srgb, var(--rp-c-bg, #ffffff) 78%, transparent)",
            backdropFilter: "blur(16px) saturate(1.4)",
            WebkitBackdropFilter: "blur(16px) saturate(1.4)",
            border: "1px solid color-mix(in srgb, var(--rp-c-divider, #e2e8f0) 60%, transparent)",
            boxShadow: [
              "0 8px 32px rgba(0,0,0,0.12)",
              "0 2px 8px rgba(0,0,0,0.06)",
              "inset 0 1px 0 rgba(255,255,255,0.1)",
            ].join(", "),
            animation: isOpen
              ? "gv-panel-enter 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : "none",
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "scale(1) translateY(0)" : "scale(0.92) translateY(8px)",
            transition: isOpen
              ? "none"
              : "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          {/* Accent shimmer line at top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #6366f1, #8b5cf6, #6366f1, transparent)",
              backgroundSize: "200% 100%",
              animation: "gv-accent-shimmer 4s linear infinite",
              zIndex: 2,
            }}
          />

          {/* Header bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: headerHeight,
              padding: "0 12px",
              borderBottom: "1px solid color-mix(in srgb, var(--rp-c-divider, #e2e8f0) 40%, transparent)",
              background: "color-mix(in srgb, var(--rp-c-bg, #ffffff) 50%, transparent)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                fontFamily:
                  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--rp-c-brand, #6366f1)",
                opacity: 0.85,
                userSelect: "none",
              }}
            >
              Graph View
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: "color-mix(in srgb, var(--rp-c-brand, #6366f1) 60%, gray)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "color-mix(in srgb, var(--rp-c-brand, #6366f1) 12%, transparent)";
                e.currentTarget.style.color = "var(--rp-c-brand, #6366f1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color =
                  "color-mix(in srgb, var(--rp-c-brand, #6366f1) 60%, gray)";
              }}
              aria-label="Close graph view"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <line x1="2" y1="2" x2="10" y2="10" />
                <line x1="10" y1="2" x2="2" y2="10" />
              </svg>
            </button>
          </div>

          {/* Graph area */}
          <div style={{ position: "relative", width: "100%", height: graphHeight }}>
            <GraphView
              width={panelSize.width}
              height={graphHeight}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>
      )}
    </>
  );
}
