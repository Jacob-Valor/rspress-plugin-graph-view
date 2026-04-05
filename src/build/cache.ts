import type { CollectedRoute, GraphBuildDiagnostics, GraphBuildOptions, GraphBuildResult } from "./types";

interface CachedRouteDocument {
  mtimeMs: number;
  size: number;
  inferredTitle?: string;
  rawLinks: string[];
}

interface CachedGraphBuildResult {
  signature: string;
  graphData: GraphBuildResult["graphData"];
  moduleSource: string;
}

export interface GraphBuildCache {
  documents: Map<string, CachedRouteDocument>;
  lastResult?: CachedGraphBuildResult;
}

interface ScannedRouteDocument {
  route: CollectedRoute;
  mtimeMs: number;
  size: number;
  inferredTitle?: string;
  rawLinks: string[];
}

export function createGraphBuildCache(): GraphBuildCache {
  return {
    documents: new Map<string, CachedRouteDocument>(),
  };
}

export function pruneStaleDocuments(cache: GraphBuildCache, routes: CollectedRoute[]): void {
  const activePaths = new Set(routes.map((route) => route.absolutePath));

  for (const absolutePath of cache.documents.keys()) {
    if (!activePaths.has(absolutePath)) {
      cache.documents.delete(absolutePath);
    }
  }
}

export function createGraphSignature(documents: ScannedRouteDocument[]): string {
  const signatureEntries = documents.map(({ route, mtimeMs, size }) => ({
    routePath: route.routePath,
    payload: [
      route.routePath,
      route.absolutePath,
      route.relativePath,
      route.pageName,
      mtimeMs,
      size,
    ] as const,
  }));

  return JSON.stringify(
    signatureEntries
      .sort((entryA, entryB) => entryA.routePath.localeCompare(entryB.routePath))
      .map((entry) => entry.payload),
  );
}

export function maybeLogGraphBuild(
  diagnostics: GraphBuildDiagnostics,
  logger: GraphBuildOptions["logger"],
  enabled?: boolean,
): void {
  if (!enabled) {
    return;
  }

  const writeLog = logger ?? console.info;
  writeLog(
    [
      "[rspress-plugin-graph-view] graph build",
      `routes=${diagnostics.routeCount}`,
      `links=${diagnostics.linkCount}`,
      `cacheHits=${diagnostics.cacheHits}`,
      `cacheMisses=${diagnostics.cacheMisses}`,
      `reusedModule=${diagnostics.reusedModule}`,
      `total=${diagnostics.totalMs.toFixed(1)}ms`,
      `stat=${diagnostics.statMs.toFixed(1)}ms`,
      `parse=${diagnostics.parseMs.toFixed(1)}ms`,
      `resolve=${diagnostics.resolveMs.toFixed(1)}ms`,
      `serialize=${diagnostics.serializeMs.toFixed(1)}ms`,
    ].join(" | "),
  );
}

export type { ScannedRouteDocument };
