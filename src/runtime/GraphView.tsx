import { useMemo, useCallback, useEffect, useState, type ElementType } from "react";
import { useLocation } from "@rspress/core/runtime";
import { graphData } from "virtual-graph-data";
import {
  createGraphIndex,
  deriveGraphViewData,
  type ForceGraphNode,
} from "./deriveGraphViewData";

interface GraphViewProps {
  width: number;
  height: number;
  onNodeClick?: (routePath: string) => void;
}

export default function GraphView({ width, height, onNodeClick }: GraphViewProps) {
  const { pathname } = useLocation();
  const [ForceGraph, setForceGraph] = useState<ElementType | null>(null);

  useEffect(() => {
    let active = true;

    import("react-force-graph-2d").then((mod) => {
      if (active) {
        setForceGraph(() => mod.default);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const currentRoutePath = useMemo(() => {
    return pathname.replace(/\/$/, "") || "/";
  }, [pathname]);

  const graphIndex = useMemo(() => createGraphIndex(graphData), []);
  const { nodes: fgNodes, links: fgLinks, isLargeGraph } = useMemo(
    () => deriveGraphViewData(graphData, graphIndex, currentRoutePath),
    [graphIndex, currentRoutePath],
  );

  const handleNodeClick = useCallback(
    (node: { routePath?: string }) => {
      if (node.routePath && onNodeClick) {
        onNodeClick(node.routePath);
      }
    },
    [onNodeClick],
  );

  const nodeColor = useCallback((node: { isCurrent?: boolean }) => {
    return node.isCurrent ? "#6366f1" : "#94a3b8";
  }, []);

  const nodeCanvasObject = useCallback(
    (
      node: ForceGraphNode & { x?: number; y?: number },
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => {
      const label = node.label || "";
      const fontSize = 12 / globalScale;
      const radius = Math.max(
        4,
        Math.min(isLargeGraph ? 6 : 8, node.val * (isLargeGraph ? 1.5 : 2)),
      );

      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.isCurrent ? "#6366f1" : "#94a3b8";
      ctx.fill();

      if (node.isCurrent) {
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, radius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      const shouldDrawLabel = !isLargeGraph || node.isCurrent || globalScale >= 1.4;
      if (!shouldDrawLabel || !label) {
        return;
      }

      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = node.isCurrent ? "#6366f1" : "#64748b";
      ctx.fillText(label, node.x || 0, (node.y || 0) + radius + fontSize);
    },
    [isLargeGraph],
  );

  if (!ForceGraph) {
    return <div style={{ width, height }} />;
  }

  return (
    <ForceGraph
      graphData={{ nodes: fgNodes, links: fgLinks }}
      width={width}
      height={height}
      nodeRelSize={1}
      nodeColor={nodeColor}
      nodeCanvasObject={nodeCanvasObject}
      linkColor={() => "#334155"}
      linkWidth={isLargeGraph ? 0.75 : 1}
      linkDirectionalParticles={isLargeGraph ? 0 : 2}
      linkDirectionalParticleWidth={isLargeGraph ? 0 : 2}
      onNodeClick={handleNodeClick as (node: unknown, event: MouseEvent) => void}
      backgroundColor="transparent"
      d3AlphaDecay={isLargeGraph ? 0.06 : 0.02}
      d3VelocityDecay={isLargeGraph ? 0.4 : 0.3}
    />
  );
}
