import { useMemo, useCallback, useEffect, useState, type ElementType } from "react";
import { useLocation } from "@rspress/core/runtime";
import { graphData } from "virtual-graph-data";
import type { GraphNode, GraphLink } from "../types";

interface GraphViewProps {
  width: number;
  height: number;
  onNodeClick?: (routePath: string) => void;
}

interface FGNode {
  id: string;
  label: string;
  routePath: string;
  val: number;
  isCurrent: boolean;
}

interface FGLink {
  source: string;
  target: string;
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

  const fgNodes = useMemo<FGNode[]>(() => {
    const currentNode = graphData.nodes.find((n: GraphNode) => n.id === currentRoutePath);

    let filteredNodes: GraphNode[];
    let filteredLinks: GraphLink[];

    if (!currentNode) {
      filteredNodes = graphData.nodes;
      filteredLinks = graphData.links;
    } else {
      const connectedIds = new Set<string>([currentRoutePath]);
      const connectedLinks: GraphLink[] = [];

      for (const link of graphData.links) {
        if (link.source === currentRoutePath || link.target === currentRoutePath) {
          connectedIds.add(link.source);
          connectedIds.add(link.target);
          connectedLinks.push(link);
        }
      }

      filteredNodes = graphData.nodes.filter((n: GraphNode) => connectedIds.has(n.id));
      filteredLinks = connectedLinks;
    }

    return filteredNodes.map((n: GraphNode) => ({
      id: n.id,
      label: n.label,
      routePath: n.routePath,
      val: n.val,
      isCurrent: n.id === currentRoutePath,
    }));
  }, [currentRoutePath]);

  const fgLinks = useMemo<FGLink[]>(() => {
    const currentNode = graphData.nodes.find((n: GraphNode) => n.id === currentRoutePath);

    if (!currentNode) {
      return graphData.links.map((l: GraphLink) => ({
        source: l.source,
        target: l.target,
      }));
    }

    const connectedIds = new Set<string>([currentRoutePath]);
    const connectedLinks: GraphLink[] = [];

    for (const link of graphData.links) {
      if (link.source === currentRoutePath || link.target === currentRoutePath) {
        connectedIds.add(link.source);
        connectedIds.add(link.target);
        connectedLinks.push(link);
      }
    }

    return connectedLinks.map((l: GraphLink) => ({
      source: l.source,
      target: l.target,
    }));
  }, [currentRoutePath]);

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
    (node: { x?: number; y?: number; isCurrent?: boolean; label?: string; val?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.label || "";
      const fontSize = 12 / globalScale;
      const radius = Math.max(4, Math.min(8, (node.val || 1) * 2));

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

      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = node.isCurrent ? "#6366f1" : "#64748b";
      ctx.fillText(label, node.x || 0, (node.y || 0) + radius + fontSize);
    },
    [],
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
      linkWidth={1}
      linkDirectionalParticles={2}
      linkDirectionalParticleWidth={2}
      onNodeClick={handleNodeClick as (node: unknown, event: MouseEvent) => void}
      backgroundColor="transparent"
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
    />
  );
}
