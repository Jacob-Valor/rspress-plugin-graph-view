import type { GraphData, GraphLink, GraphNode } from "../types";

export interface ForceGraphNode extends GraphNode {
  isCurrent: boolean;
}

export interface ForceGraphLink {
  source: string;
  target: string;
}

export interface GraphIndex {
  nodeById: Map<string, GraphNode>;
  adjacentIdsByNode: Map<string, Set<string>>;
  linksByNode: Map<string, GraphLink[]>;
}

export interface DerivedGraphViewData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
  isLargeGraph: boolean;
}

export const LARGE_GRAPH_NODE_THRESHOLD = 80;
export const LARGE_GRAPH_LINK_THRESHOLD = 160;

export function createGraphIndex(graphData: GraphData): GraphIndex {
  const nodeById = new Map<string, GraphNode>();
  const adjacentIdsByNode = new Map<string, Set<string>>();
  const linksByNode = new Map<string, GraphLink[]>();

  for (const node of graphData.nodes) {
    nodeById.set(node.id, node);
  }

  for (const link of graphData.links) {
    ensureNeighborSet(adjacentIdsByNode, link.source).add(link.target);
    ensureNeighborSet(adjacentIdsByNode, link.target).add(link.source);
    ensureLinkBucket(linksByNode, link.source).push(link);

    if (link.target !== link.source) {
      ensureLinkBucket(linksByNode, link.target).push(link);
    }
  }

  return {
    nodeById,
    adjacentIdsByNode,
    linksByNode,
  };
}

export function deriveGraphViewData(
  graphData: GraphData,
  graphIndex: GraphIndex,
  currentRoutePath: string,
): DerivedGraphViewData {
  const currentNode = graphIndex.nodeById.get(currentRoutePath);

  if (!currentNode) {
    return {
      nodes: graphData.nodes.map((node) => ({
        ...node,
        isCurrent: false,
      })),
      links: graphData.links.map((link) => ({
        source: link.source,
        target: link.target,
      })),
      isLargeGraph:
        graphData.nodes.length > LARGE_GRAPH_NODE_THRESHOLD ||
        graphData.links.length > LARGE_GRAPH_LINK_THRESHOLD,
    };
  }

  const connectedIds = new Set(graphIndex.adjacentIdsByNode.get(currentRoutePath) ?? []);
  connectedIds.add(currentRoutePath);

  const nodes: ForceGraphNode[] = [];
  for (const nodeId of connectedIds) {
    const node = graphIndex.nodeById.get(nodeId);
    if (!node) {
      continue;
    }

    nodes.push({
      ...node,
      isCurrent: node.id === currentRoutePath,
    });
  }

  const links = (graphIndex.linksByNode.get(currentRoutePath) ?? []).map((link) => ({
    source: link.source,
    target: link.target,
  }));

  return {
    nodes,
    links,
    isLargeGraph:
      nodes.length > LARGE_GRAPH_NODE_THRESHOLD || links.length > LARGE_GRAPH_LINK_THRESHOLD,
  };
}

function ensureNeighborSet(
  adjacentIdsByNode: GraphIndex["adjacentIdsByNode"],
  nodeId: string,
): Set<string> {
  const existing = adjacentIdsByNode.get(nodeId);
  if (existing) {
    return existing;
  }

  const neighborSet = new Set<string>();
  adjacentIdsByNode.set(nodeId, neighborSet);
  return neighborSet;
}

function ensureLinkBucket(linksByNode: GraphIndex["linksByNode"], nodeId: string): GraphLink[] {
  const existing = linksByNode.get(nodeId);
  if (existing) {
    return existing;
  }

  const linkBucket: GraphLink[] = [];
  linksByNode.set(nodeId, linkBucket);
  return linkBucket;
}
