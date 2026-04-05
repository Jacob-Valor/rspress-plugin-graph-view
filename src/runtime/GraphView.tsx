import {
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  Component,
  type ElementType,
  type ReactNode,
} from "react";
import { useLocation } from "@rspress/core/runtime";
import { graphData } from "virtual-graph-data";
import {
  createGraphIndex,
  deriveGraphViewData,
  type ForceGraphNode,
} from "./deriveGraphViewData";

export interface GraphViewColors {
  currentNode?: string;
  currentNodeGlow?: string;
  currentNodeRing?: string;
  currentLabel?: string;
  node?: string;
  nodeHover?: string;
  nodeShadow?: string;
  label?: string;
  labelHover?: string;
  link?: string;
  linkHighlight?: string;
  particleColor?: string;
  gridDot?: string;
}

interface GraphViewProps {
  width: number;
  height: number;
  onNodeClick?: (routePath: string) => void;
  colors?: GraphViewColors;
}

const LIGHT_COLORS = {
  currentNode: "#6366f1",
  currentNodeGlow: "rgba(99, 102, 241, 0.25)",
  currentNodeRing: "rgba(129, 140, 248, 0.5)",
  currentLabel: "#6366f1",
  node: "#94a3b8",
  nodeHover: "#818cf8",
  nodeShadow: "rgba(15, 23, 42, 0.18)",
  label: "#64748b",
  labelHover: "#475569",
  link: "rgba(100, 116, 139, 0.35)",
  linkHighlight: "rgba(99, 102, 241, 0.55)",
  particleColor: "#818cf8",
  gridDot: "rgba(148, 163, 184, 0.12)",
  labelShadow: "rgba(0,0,0,0.12)",
  hoverRing: "rgba(129, 140, 248, 0.45)",
  nodeGradLight: "#b0bec5",
  nodeGradHoverLight: "#a5b4fc",
  fallbackLinkDim: "rgba(100, 116, 139, 0.1)",
  loaderBorder: "rgba(99, 102, 241, 0.2)",
  loaderTop: "#6366f1",
};

const DARK_COLORS = {
  currentNode: "#818cf8",
  currentNodeGlow: "rgba(129, 140, 248, 0.35)",
  currentNodeRing: "rgba(165, 180, 252, 0.5)",
  currentLabel: "#a5b4fc",
  node: "#64748b",
  nodeHover: "#818cf8",
  nodeShadow: "rgba(0, 0, 0, 0.3)",
  label: "#94a3b8",
  labelHover: "#cbd5e1",
  link: "rgba(148, 163, 184, 0.25)",
  linkHighlight: "rgba(129, 140, 248, 0.6)",
  particleColor: "#a5b4fc",
  gridDot: "rgba(148, 163, 184, 0.08)",
  labelShadow: "rgba(0,0,0,0.4)",
  hoverRing: "rgba(165, 180, 252, 0.5)",
  nodeGradLight: "#78909c",
  nodeGradHoverLight: "#93a5f8",
  fallbackLinkDim: "rgba(100, 116, 139, 0.08)",
  loaderBorder: "rgba(129, 140, 248, 0.2)",
  loaderTop: "#818cf8",
};

const FONT_STACK =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  const html = document.documentElement;
  return (
    html.classList.contains("dark") ||
    html.getAttribute("data-theme") === "dark" ||
    html.closest("[data-theme='dark']") !== null
  );
}

function useTheme(): boolean {
  const [dark, setDark] = useState(() => isDarkMode());

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(isDarkMode());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return dark;
}

function mergeColors(
  base: typeof LIGHT_COLORS,
  overrides?: GraphViewColors,
): typeof LIGHT_COLORS {
  if (!overrides) return base;
  return { ...base, ...overrides };
}

// ─── Error Boundary ────────────────────────────────────────────────

class GraphErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function GraphFallback({ width, height }: { width: number; height: number }) {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 8,
        color: "#94a3b8",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 13,
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>Graph view unavailable</span>
    </div>
  );
}

export interface GraphViewHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  zoomToFit: () => void;
}

export default forwardRef<GraphViewHandle, GraphViewProps>(function GraphView(
  { width, height, onNodeClick, colors: customColors },
  ref,
) {
  const { pathname } = useLocation();
  const dark = useTheme();
  const baseColors = dark ? DARK_COLORS : LIGHT_COLORS;
  const colors = useMemo(
    () => mergeColors(baseColors, customColors),
    [baseColors, customColors],
  );
  const [ForceGraph, setForceGraph] = useState<ElementType | null>(null);
  const [forceGraphError, setForceGraphError] = useState(false);
  const hoveredNodeRef = useRef<string | null>(null);
  const connectedSetRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const forceRef = useRef<{ d3ReheatSimulation?: () => void } | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => {
        const fg = forceRef.current as any;
        if (fg?.zoom) {
          const current = fg.zoom();
          fg.zoom(current * 1.3, 300);
        }
      },
      zoomOut: () => {
        const fg = forceRef.current as any;
        if (fg?.zoom) {
          const current = fg.zoom();
          fg.zoom(current / 1.3, 300);
        }
      },
      zoomReset: () => {
        const fg = forceRef.current as any;
        if (fg?.zoom) {
          fg.zoom(1, 300);
        }
      },
      zoomToFit: () => {
        const fg = forceRef.current as any;
        if (fg?.zoomToFit) {
          fg.zoomToFit(300, 16);
        }
      },
    }),
    [],
  );

  useEffect(() => {
    let active = true;
    import("react-force-graph-2d")
      .then((mod) => {
        if (active) setForceGraph(() => mod.default);
      })
      .catch(() => {
        if (active) setForceGraphError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      frameRef.current++;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const currentRoutePath = useMemo(() => {
    return pathname.replace(/\/$/, "") || "/";
  }, [pathname]);

  const graphIndex = useMemo(() => createGraphIndex(graphData), []);
  const {
    nodes: fgNodes,
    links: fgLinks,
    isLargeGraph,
  } = useMemo(
    () => deriveGraphViewData(graphData, graphIndex, currentRoutePath),
    [graphIndex, currentRoutePath],
  );

  const connectedToNode = useCallback(
    (nodeId: string): Set<string> => {
      const connected = new Set<string>();
      for (const link of fgLinks) {
        const src =
          typeof link.source === "object"
            ? (link.source as ForceGraphNode).id
            : link.source;
        const tgt =
          typeof link.target === "object"
            ? (link.target as ForceGraphNode).id
            : link.target;
        if (src === nodeId) connected.add(tgt as string);
        if (tgt === nodeId) connected.add(src as string);
      }
      connected.add(nodeId);
      return connected;
    },
    [fgLinks],
  );

  const handleNodeClick = useCallback(
    (node: { routePath?: string }) => {
      if (node.routePath && onNodeClick) {
        onNodeClick(node.routePath);
      }
    },
    [onNodeClick],
  );

  const handleNodeHover = useCallback(
    (node: ForceGraphNode | null) => {
      if (node?.id) {
        hoveredNodeRef.current = node.id;
        connectedSetRef.current = connectedToNode(node.id);
      } else {
        hoveredNodeRef.current = null;
        connectedSetRef.current.clear();
      }
    },
    [connectedToNode],
  );

  const nodeColor = useCallback(
    (node: { isCurrent?: boolean }) => {
      return node.isCurrent ? colors.currentNode : colors.node;
    },
    [colors.currentNode, colors.node],
  );

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, globalScale: number) => {
      const spacing = 24;
      const dotRadius = 0.6 / globalScale;

      ctx.fillStyle = colors.gridDot;
      const startX = Math.floor(-width / (2 * globalScale) / spacing) * spacing;
      const startY =
        Math.floor(-height / (2 * globalScale) / spacing) * spacing;
      const endX = -startX + spacing;
      const endY = -startY + spacing;

      for (let x = startX; x < endX; x += spacing) {
        for (let y = startY; y < endY; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [width, height, colors.gridDot],
  );

  const nodeCanvasObject = useCallback(
    (
      node: ForceGraphNode & { x?: number; y?: number },
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => {
      const label = node.label || "";
      const fontSize = Math.max(10, 12) / globalScale;
      const radius = Math.max(
        4,
        Math.min(isLargeGraph ? 6 : 8, node.val * (isLargeGraph ? 1.5 : 2)),
      );
      const nx = node.x || 0;
      const ny = node.y || 0;

      const isHovered = hoveredNodeRef.current === node.id;
      const isConnectedToHover = connectedSetRef.current.has(node.id);
      const hasHover = hoveredNodeRef.current !== null;
      const dimmed = hasHover && !isConnectedToHover && !node.isCurrent;

      if (node.isCurrent) {
        const pulsePhase = (frameRef.current % 180) / 180;
        const pulseRadius = radius + 6 + Math.sin(pulsePhase * Math.PI * 2) * 3;
        const pulseAlpha = 0.15 + Math.sin(pulsePhase * Math.PI * 2) * 0.08;

        const outerGlow = ctx.createRadialGradient(
          nx,
          ny,
          radius,
          nx,
          ny,
          radius + 14,
        );
        outerGlow.addColorStop(0, colors.currentNodeGlow);
        outerGlow.addColorStop(1, "rgba(99, 102, 241, 0)");
        ctx.beginPath();
        ctx.arc(nx, ny, radius + 14, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nx, ny, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(129, 140, 248, ${pulseAlpha})`;
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(nx, ny, radius + 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = colors.currentNodeRing;
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      }

      if (!node.isCurrent && !isLargeGraph) {
        ctx.beginPath();
        ctx.arc(nx, ny + 0.8, radius + 0.5, 0, Math.PI * 2);
        ctx.fillStyle = colors.nodeShadow;
        ctx.fill();
      }

      const nodeGrad = ctx.createRadialGradient(
        nx - radius * 0.3,
        ny - radius * 0.3,
        0,
        nx,
        ny,
        radius,
      );
      if (node.isCurrent) {
        nodeGrad.addColorStop(0, dark ? "#a5b4fc" : "#818cf8");
        nodeGrad.addColorStop(1, colors.currentNode);
      } else if (isHovered) {
        nodeGrad.addColorStop(0, colors.nodeGradHoverLight);
        nodeGrad.addColorStop(1, colors.nodeHover);
      } else {
        nodeGrad.addColorStop(0, colors.nodeGradLight);
        nodeGrad.addColorStop(1, colors.node);
      }

      ctx.globalAlpha = dimmed ? 0.3 : 1;
      ctx.beginPath();
      ctx.arc(nx, ny, radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeGrad;
      ctx.fill();

      if (isHovered && !node.isCurrent) {
        ctx.beginPath();
        ctx.arc(nx, ny, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = colors.hoverRing;
        ctx.lineWidth = 1.2 / globalScale;
        ctx.stroke();
      }

      const shouldDrawLabel =
        !isLargeGraph || node.isCurrent || isHovered || globalScale >= 1.4;
      if (shouldDrawLabel && label) {
        const fontW = node.isCurrent || isHovered ? 600 : 400;
        ctx.font = `${fontW} ${fontSize}px ${FONT_STACK}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = colors.labelShadow;
        ctx.fillText(label, nx + 0.3, ny + radius + fontSize + 0.3);

        if (node.isCurrent) {
          ctx.fillStyle = colors.currentLabel;
        } else if (isHovered) {
          ctx.fillStyle = colors.labelHover;
        } else {
          ctx.fillStyle = colors.label;
        }
        ctx.fillText(label, nx, ny + radius + fontSize);
      }

      ctx.globalAlpha = 1;
    },
    [isLargeGraph, colors, dark],
  );

  const linkColor = useCallback(
    (link: { source?: unknown; target?: unknown }) => {
      if (!hoveredNodeRef.current) return colors.link;
      const src =
        typeof link.source === "object"
          ? (link.source as ForceGraphNode).id
          : link.source;
      const tgt =
        typeof link.target === "object"
          ? (link.target as ForceGraphNode).id
          : link.target;
      const isConnected =
        src === hoveredNodeRef.current || tgt === hoveredNodeRef.current;
      return isConnected ? colors.linkHighlight : colors.fallbackLinkDim;
    },
    [colors.link, colors.linkHighlight, colors.fallbackLinkDim],
  );

  const linkWidth = useCallback(
    (link: { source?: unknown; target?: unknown }) => {
      if (!hoveredNodeRef.current) return isLargeGraph ? 0.75 : 1;
      const src =
        typeof link.source === "object"
          ? (link.source as ForceGraphNode).id
          : link.source;
      const tgt =
        typeof link.target === "object"
          ? (link.target as ForceGraphNode).id
          : link.target;
      const isConnected =
        src === hoveredNodeRef.current || tgt === hoveredNodeRef.current;
      return isConnected ? 1.8 : isLargeGraph ? 0.5 : 0.6;
    },
    [isLargeGraph],
  );

  if (forceGraphError) {
    return <GraphFallback width={width} height={height} />;
  }

  if (!ForceGraph) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: `2px solid ${colors.loaderBorder}`,
            borderTopColor: colors.loaderTop,
            animation: "gv-fab-spin-in 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <GraphErrorBoundary
      fallback={<GraphFallback width={width} height={height} />}
    >
      <ForceGraph
        ref={forceRef}
        graphData={{ nodes: fgNodes, links: fgLinks }}
        width={width}
        height={height}
        nodeRelSize={1}
        nodeColor={nodeColor}
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => "replace" as const}
        onNodeHover={handleNodeHover as (node: unknown) => void}
        linkColor={linkColor as (link: object) => string}
        linkWidth={linkWidth as (link: object) => number}
        linkDirectionalParticles={isLargeGraph ? 0 : 2}
        linkDirectionalParticleWidth={isLargeGraph ? 0 : 2}
        linkDirectionalParticleColor={() => colors.particleColor}
        onNodeClick={
          handleNodeClick as (node: unknown, event: MouseEvent) => void
        }
        onRenderFramePre={drawBackground}
        backgroundColor="transparent"
        d3AlphaDecay={isLargeGraph ? 0.06 : 0.02}
        d3VelocityDecay={isLargeGraph ? 0.4 : 0.3}
      />
    </GraphErrorBoundary>
  );
});
