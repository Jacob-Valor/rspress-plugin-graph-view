import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "@rspress/core/runtime";
import GraphView, { type GraphViewHandle, type GraphViewColors } from "./GraphView";

interface GraphSidebarProps {
  colors?: GraphViewColors;
}

function GraphIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="6" r="2.5" />
      <circle cx="19" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <line x1="7.5" y1="6" x2="16.5" y2="6" />
      <line x1="6.5" y1="8" x2="10.5" y2="16" />
      <line x1="17.5" y1="8" x2="13.5" y2="16" />
    </svg>
  );
}

function ChevronIcon({ expanded, size = 14 }: { expanded: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

interface ZoomButtonProps {
  children: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
}

function ZoomButton({ children, ariaLabel, onClick }: ZoomButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: 22,
        height: 22,
        borderRadius: 4,
        border: "none",
        background: "transparent",
        color: "var(--rp-c-text-2, #64748b)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        transition: "background 0.12s, color 0.12s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          "color-mix(in srgb, var(--rp-c-brand, #6366f1) 12%, transparent)";
        e.currentTarget.style.color = "var(--rp-c-brand, #6366f1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--rp-c-text-2, #64748b)";
      }}
    >
      {children}
    </button>
  );
}

export default function GraphSidebar({ colors }: GraphSidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [stats, setStats] = useState<{ nodes: number; links: number } | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const graphViewRef = useRef<GraphViewHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 268, height: 200 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = containerRef.current;
      if (container) {
        const width = container.clientWidth - 24;
        const height = Math.min(280, Math.max(180, width * 0.75));
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [isExpanded]);

  useEffect(() => {
    const s = graphViewRef.current?.getStats();
    if (s) setStats(s);
  }, [pathname]);

  const handleNodeClick = useCallback(
    (routePath: string) => {
      navigate(routePath);
    },
    [navigate],
  );

  const handleNodeHoverChange = useCallback(
    (label: string | null, _x: number, _y: number) => {
      setHoveredLabel(label);
      const s = graphViewRef.current?.getStats();
      if (s) setStats(s);
    },
    [],
  );

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const sidebarStyles: React.CSSProperties = {
    marginTop: 24,
    borderTop: "1px solid var(--rp-c-divider, #e2e8f0)",
    paddingTop: 16,
  };

  const headerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: isExpanded ? 12 : 0,
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
  };

  const titleStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "var(--rp-c-text-1, #334155)",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const contentStyles: React.CSSProperties = {
    overflow: "hidden",
    transition: "max-height 0.3s ease, opacity 0.3s ease",
    maxHeight: isExpanded ? dimensions.height + 60 : 0,
    opacity: isExpanded ? 1 : 0,
  };

  const graphContainerStyles: React.CSSProperties = {
    position: "relative",
    background:
      "color-mix(in srgb, var(--rp-c-bg-soft, #f8fafc) 80%, transparent)",
    borderRadius: 8,
    padding: 8,
    border: "1px solid var(--rp-c-divider, #e2e8f0)",
  };

  const tooltipStyles: React.CSSProperties = {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    pointerEvents: "none",
    zIndex: 20,
    background:
      "color-mix(in srgb, var(--rp-c-bg, #ffffff) 95%, transparent)",
    backdropFilter: "blur(8px)",
    border: "1px solid var(--rp-c-divider, #e2e8f0)",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 500,
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "var(--rp-c-text-1, #334155)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    opacity: hoveredLabel ? 1 : 0,
    transition: "opacity 0.15s ease",
  };

  const toolbarStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    padding: "4px 8px",
    background:
      "color-mix(in srgb, var(--rp-c-bg-soft, #f8fafc) 60%, transparent)",
    borderRadius: 6,
    border: "1px solid var(--rp-c-divider, #e2e8f0)",
  };

  const statsStyles: React.CSSProperties = {
    fontSize: 11,
    color: "var(--rp-c-text-2, #64748b)",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  return (
    <div style={sidebarStyles}>
      <div style={headerStyles} onClick={toggleExpanded} role="button" tabIndex={0}>
        <div style={titleStyles}>
          <GraphIcon size={14} />
          <span>Graph View</span>
        </div>
        <ChevronIcon expanded={isExpanded} size={14} />
      </div>

      <div style={contentStyles}>
        <div ref={containerRef} style={graphContainerStyles}>
          <GraphView
            ref={graphViewRef}
            width={dimensions.width}
            height={dimensions.height}
            onNodeClick={handleNodeClick}
            onNodeHoverChange={handleNodeHoverChange}
            colors={colors}
          />
          <div style={tooltipStyles}>{hoveredLabel || " "}</div>
        </div>

        <div style={toolbarStyles}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              background:
                "color-mix(in srgb, var(--rp-c-divider, #e2e8f0) 35%, transparent)",
              borderRadius: 5,
              padding: "1px 2px",
              border:
                "1px solid color-mix(in srgb, var(--rp-c-divider, #e2e8f0) 50%, transparent)",
            }}
          >
            <ZoomButton
              ariaLabel="Zoom in"
              onClick={() => graphViewRef.current?.zoomIn()}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </ZoomButton>
            <ZoomButton
              ariaLabel="Zoom out"
              onClick={() => graphViewRef.current?.zoomOut()}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </ZoomButton>
            <ZoomButton
              ariaLabel="Fit to view"
              onClick={() => graphViewRef.current?.zoomToFit()}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
              </svg>
            </ZoomButton>
            <ZoomButton
              ariaLabel="Reset zoom"
              onClick={() => graphViewRef.current?.zoomReset()}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </ZoomButton>
          </div>
          <span style={statsStyles}>
            {stats ? (
              <>
                {stats.nodes} {stats.nodes === 1 ? "node" : "nodes"}
                {" · "}
                {stats.links} {stats.links === 1 ? "link" : "links"}
              </>
            ) : (
              "Loading…"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
