import { describe, expect, test } from "bun:test";
import type { GraphData } from "../types";
import {
  createGraphIndex,
  deriveGraphViewData,
  LARGE_GRAPH_LINK_THRESHOLD,
  LARGE_GRAPH_NODE_THRESHOLD,
} from "./deriveGraphViewData";

describe("deriveGraphViewData", () => {
  test("returns the current node neighborhood without re-scanning the entire graph", () => {
    const graphData: GraphData = {
      nodes: [
        { id: "/", label: "Home", routePath: "/", val: 2 },
        { id: "/guide", label: "Guide", routePath: "/guide", val: 2 },
        { id: "/api", label: "API", routePath: "/api", val: 1 },
      ],
      links: [
        { source: "/", target: "/guide" },
        { source: "/guide", target: "/api" },
      ],
    };

    const graphIndex = createGraphIndex(graphData);
    const derived = deriveGraphViewData(graphData, graphIndex, "/guide");

    expect(derived.nodes.map((node) => node.id).sort()).toEqual(["/", "/api", "/guide"]);
    expect(derived.links).toEqual([
      { source: "/", target: "/guide" },
      { source: "/guide", target: "/api" },
    ]);
    expect(derived.nodes.find((node) => node.id === "/guide")?.isCurrent).toBe(true);
  });

  test("falls back to the full graph when the current route is not present", () => {
    const graphData: GraphData = {
      nodes: [
        { id: "/", label: "Home", routePath: "/", val: 1 },
        { id: "/guide", label: "Guide", routePath: "/guide", val: 1 },
      ],
      links: [{ source: "/", target: "/guide" }],
    };

    const graphIndex = createGraphIndex(graphData);
    const derived = deriveGraphViewData(graphData, graphIndex, "/missing");

    expect(derived.nodes.map((node) => node.id)).toEqual(["/", "/guide"]);
    expect(derived.links).toEqual([{ source: "/", target: "/guide" }]);
    expect(derived.nodes.every((node) => !node.isCurrent)).toBe(true);
  });

  test("marks dense graphs so rendering can disable expensive adornments", () => {
    const graphData: GraphData = {
      nodes: Array.from({ length: LARGE_GRAPH_NODE_THRESHOLD + 1 }, (_, index) => ({
        id: `/node-${index}`,
        label: `Node ${index}`,
        routePath: `/node-${index}`,
        val: 1,
      })),
      links: Array.from({ length: LARGE_GRAPH_LINK_THRESHOLD + 1 }, (_, index) => ({
        source: `/node-${index % LARGE_GRAPH_NODE_THRESHOLD}`,
        target: `/node-${(index + 1) % LARGE_GRAPH_NODE_THRESHOLD}`,
      })),
    };

    const graphIndex = createGraphIndex(graphData);
    const derived = deriveGraphViewData(graphData, graphIndex, "/missing");

    expect(derived.isLargeGraph).toBe(true);
  });

  describe("search filtering", () => {
    const graphData: GraphData = {
      nodes: [
        { id: "/", label: "Home", routePath: "/", val: 1 },
        { id: "/guide", label: "Getting Started", routePath: "/guide", val: 1 },
        { id: "/api", label: "API Reference", routePath: "/api", val: 1 },
      ],
      links: [
        { source: "/", target: "/guide" },
        { source: "/guide", target: "/api" },
      ],
    };

    const graphIndex = createGraphIndex(graphData);

    test("sets isMatched to true for nodes whose label matches the search query (case-insensitive)", () => {
      const derived = deriveGraphViewData(graphData, graphIndex, "/guide", "getting");

      const matched = derived.nodes.filter((node) => node.isMatched);
      expect(matched).toHaveLength(1);
      expect(matched[0]?.id).toBe("/guide");

      const unmatched = derived.nodes.filter((node) => !node.isMatched);
      expect(unmatched).toHaveLength(2);
    });

    test("sets isMatched to true for nodes whose routePath matches the search query", () => {
      const derived = deriveGraphViewData(graphData, graphIndex, "/guide", "/api");

      const matched = derived.nodes.filter((node) => node.isMatched);
      expect(matched).toHaveLength(1);
      expect(matched[0]?.id).toBe("/api");
    });

    test("sets hasActiveSearch to false when no query is provided", () => {
      const derived = deriveGraphViewData(graphData, graphIndex, "/guide");
      expect(derived.hasActiveSearch).toBe(false);
    });

    test("sets hasActiveSearch to true when a query is provided", () => {
      const derived = deriveGraphViewData(graphData, graphIndex, "/guide", "home");
      expect(derived.hasActiveSearch).toBe(true);
    });

    test("all nodes match when all nodes match query or query is empty", () => {
      const derived = deriveGraphViewData(graphData, graphIndex, "/guide", "");
      expect(derived.nodes.every((node) => node.isMatched)).toBe(true);
      expect(derived.hasActiveSearch).toBe(false);
    });
  });
});
