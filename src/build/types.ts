import type { GraphData } from "../types";

export interface CollectedRoute {
  routePath: string;
  absolutePath: string;
  relativePath: string;
  pageName: string;
}

export interface GraphBuildOptions {
  profile?: boolean;
  logger?: (message: string) => void;
}

export interface GraphBuildDiagnostics {
  routeCount: number;
  linkCount: number;
  cacheHits: number;
  cacheMisses: number;
  reusedModule: boolean;
  totalMs: number;
  statMs: number;
  parseMs: number;
  resolveMs: number;
  serializeMs: number;
}

export interface GraphBuildResult {
  graphData: GraphData;
  moduleSource: string;
  diagnostics: GraphBuildDiagnostics;
}
