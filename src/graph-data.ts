import { readFile, stat } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import * as path from "node:path";
import { MDASTFromMarkdown, unistVisit } from "rspress-plugin-devkit";
import type { GraphData, GraphLink, GraphNode } from "./types";

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

interface CachedRouteDocument {
  mtimeMs: number;
  size: number;
  inferredTitle?: string;
  rawLinks: string[];
}

interface CachedGraphBuildResult {
  signature: string;
  graphData: GraphData;
  moduleSource: string;
}

interface GraphBuildCache {
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

export async function buildGraphModule(
  routes: CollectedRoute[],
  cache: GraphBuildCache,
  options: GraphBuildOptions = {},
): Promise<GraphBuildResult> {
  pruneStaleDocuments(cache, routes);

  const diagnostics: GraphBuildDiagnostics = {
    routeCount: routes.length,
    linkCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    reusedModule: false,
    totalMs: 0,
    statMs: 0,
    parseMs: 0,
    resolveMs: 0,
    serializeMs: 0,
  };

  const shouldProfile = options.profile ?? false;
  const totalStart = performance.now();
  const scannedDocuments = await Promise.all(
    routes.map(async (route) => {
      const statStart = shouldProfile ? performance.now() : 0;
      const fileStat = await stat(route.absolutePath);
      if (shouldProfile) {
        diagnostics.statMs += performance.now() - statStart;
      }

      const cachedDocument = cache.documents.get(route.absolutePath);
      if (
        cachedDocument &&
        cachedDocument.mtimeMs === fileStat.mtimeMs &&
        cachedDocument.size === fileStat.size
      ) {
        diagnostics.cacheHits += 1;
        return {
          route,
          mtimeMs: fileStat.mtimeMs,
          size: fileStat.size,
          inferredTitle: cachedDocument.inferredTitle,
          rawLinks: cachedDocument.rawLinks,
        } satisfies ScannedRouteDocument;
      }

      const parseStart = shouldProfile ? performance.now() : 0;
      const content = await readFile(route.absolutePath, "utf8");
      const inferredTitle = extractDisplayTitle(content);
      const rawLinks = extractMarkdownLinks(content);
      if (shouldProfile) {
        diagnostics.parseMs += performance.now() - parseStart;
      }
      diagnostics.cacheMisses += 1;

      const scannedDocument = {
        route,
        mtimeMs: fileStat.mtimeMs,
        size: fileStat.size,
        inferredTitle,
        rawLinks,
      } satisfies ScannedRouteDocument;

      cache.documents.set(route.absolutePath, {
        mtimeMs: fileStat.mtimeMs,
        size: fileStat.size,
        inferredTitle,
        rawLinks,
      });

      return scannedDocument;
    }),
  );

  const signature = createGraphSignature(scannedDocuments);
  if (cache.lastResult?.signature === signature) {
    diagnostics.reusedModule = true;
    diagnostics.linkCount = cache.lastResult.graphData.links.length;
    diagnostics.totalMs = performance.now() - totalStart;
    maybeLogGraphBuild(diagnostics, options.logger, shouldProfile);

    return {
      graphData: cache.lastResult.graphData,
      moduleSource: cache.lastResult.moduleSource,
      diagnostics,
    };
  }

  const resolveStart = shouldProfile ? performance.now() : 0;
  const graphData = buildGraphData(routes, scannedDocuments);
  if (shouldProfile) {
    diagnostics.resolveMs = performance.now() - resolveStart;
  }
  diagnostics.linkCount = graphData.links.length;

  const serializeStart = shouldProfile ? performance.now() : 0;
  const moduleSource = `export const graphData = ${JSON.stringify(graphData)}; export default graphData;`;
  if (shouldProfile) {
    diagnostics.serializeMs = performance.now() - serializeStart;
  }
  diagnostics.totalMs = performance.now() - totalStart;

  cache.lastResult = {
    signature,
    graphData,
    moduleSource,
  };

  maybeLogGraphBuild(diagnostics, options.logger, shouldProfile);

  return {
    graphData,
    moduleSource,
    diagnostics,
  };
}

function pruneStaleDocuments(cache: GraphBuildCache, routes: CollectedRoute[]): void {
  const activePaths = new Set(routes.map((route) => route.absolutePath));

  for (const absolutePath of cache.documents.keys()) {
    if (!activePaths.has(absolutePath)) {
      cache.documents.delete(absolutePath);
    }
  }
}

function createGraphSignature(documents: ScannedRouteDocument[]): string {
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

function buildGraphData(
  routes: CollectedRoute[],
  scannedDocuments: ScannedRouteDocument[],
): GraphData {
  const routeByPath = new Map<string, CollectedRoute>();
  const routeByFile = new Map<string, CollectedRoute>();
  const titleByRoute = new Map<string, string | undefined>();

  for (const route of routes) {
    routeByPath.set(route.routePath, route);
    for (const alias of buildFileAliases(route)) {
      routeByFile.set(alias, route);
    }
  }

  for (const scannedDocument of scannedDocuments) {
    titleByRoute.set(scannedDocument.route.routePath, scannedDocument.inferredTitle);
  }

  const links: GraphLink[] = [];
  const seenLinks = new Set<string>();
  const degreeByRoute = new Map<string, number>();

  for (const scannedDocument of scannedDocuments) {
    for (const rawLink of scannedDocument.rawLinks) {
      const targetRoute = resolveLinkedRoute(
        scannedDocument.route.absolutePath,
        rawLink,
        routeByPath,
        routeByFile,
      );

      if (!targetRoute) {
        continue;
      }

      const source = scannedDocument.route.routePath;
      const target = targetRoute.routePath;
      const linkKey = `${source}→${target}`;

      if (seenLinks.has(linkKey)) {
        continue;
      }

      seenLinks.add(linkKey);
      links.push({ source, target });
      degreeByRoute.set(source, (degreeByRoute.get(source) ?? 0) + 1);
      degreeByRoute.set(target, (degreeByRoute.get(target) ?? 0) + 1);
    }
  }

  const nodes: GraphNode[] = routes.map((route) => ({
    id: route.routePath,
    label: makeNodeLabel(route, titleByRoute.get(route.routePath)),
    routePath: route.routePath,
    val: Math.max(1, degreeByRoute.get(route.routePath) ?? 1),
  }));

  return { nodes, links };
}

function maybeLogGraphBuild(
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

function normalizeRoutePath(routePath: string): string {
  const trimmed = routePath.replace(/\/$/, "");
  return trimmed || "/";
}

function cleanLinkTarget(rawLink: string): string {
  const hashIndex = rawLink.indexOf("#");
  const queryIndex = rawLink.indexOf("?");
  let end = rawLink.length;

  if (hashIndex !== -1 && hashIndex < end) {
    end = hashIndex;
  }

  if (queryIndex !== -1 && queryIndex < end) {
    end = queryIndex;
  }

  const cleaned = rawLink.slice(0, end).trim();
  if (cleaned.startsWith("<") && cleaned.endsWith(">")) {
    return cleaned.slice(1, -1);
  }

  return cleaned;
}

function isInternalDocLink(link: string): boolean {
  return Boolean(
    link &&
      !link.startsWith("#") &&
      !link.startsWith("http://") &&
      !link.startsWith("https://") &&
      !link.startsWith("mailto:") &&
      !link.startsWith("tel:"),
  );
}

function extractMarkdownLinks(source: string): string[] {
  const tree = MDASTFromMarkdown(source);
  const links: string[] = [];

  unistVisit(tree, "link", (node) => {
    const target = cleanLinkTarget(node.url);
    if (isInternalDocLink(target)) {
      links.push(target);
    }
  });

  return links;
}

function extractDisplayTitle(source: string): string | undefined {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch?.[1]) {
    const titleMatch = frontmatterMatch[1].match(/^title:\s*(.+)$/m);
    if (titleMatch?.[1]) {
      return titleMatch[1].trim().replace(/^['"]|['"]$/g, "");
    }
  }

  const headingMatch = source.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }

  return undefined;
}

function buildFileAliases(route: CollectedRoute): string[] {
  const aliases = new Set<string>();
  const absolute = path.normalize(route.absolutePath);
  aliases.add(absolute);

  const extension = path.extname(absolute);
  const withoutExtension = extension ? absolute.slice(0, -extension.length) : absolute;

  aliases.add(withoutExtension);

  if (path.basename(withoutExtension) === "index") {
    aliases.add(path.dirname(withoutExtension));
  }

  return [...aliases];
}

function resolveLinkedRoute(
  sourceAbsolutePath: string,
  rawLink: string,
  routeByPath: Map<string, CollectedRoute>,
  routeByFile: Map<string, CollectedRoute>,
): CollectedRoute | undefined {
  if (rawLink.startsWith("/")) {
    const normalized = normalizeRoutePath(
      rawLink.replace(/\.(md|mdx)$/i, "").replace(/\/index$/i, ""),
    );

    return routeByPath.get(normalized);
  }

  const basePath = path.resolve(path.dirname(sourceAbsolutePath), rawLink);
  const candidates = new Set<string>();
  const normalizedBase = path.normalize(basePath);
  candidates.add(normalizedBase);

  const extension = path.extname(normalizedBase);
  if (extension) {
    const withoutExtension = normalizedBase.slice(0, -extension.length);
    candidates.add(withoutExtension);
    if (path.basename(withoutExtension) === "index") {
      candidates.add(path.dirname(withoutExtension));
    }
  } else {
    candidates.add(`${normalizedBase}.md`);
    candidates.add(`${normalizedBase}.mdx`);
    candidates.add(path.join(normalizedBase, "index.md"));
    candidates.add(path.join(normalizedBase, "index.mdx"));
  }

  for (const candidate of candidates) {
    const matchedRoute = routeByFile.get(path.normalize(candidate));
    if (matchedRoute) {
      return matchedRoute;
    }
  }

  return undefined;
}

function makeNodeLabel(route: CollectedRoute, inferredTitle?: string): string {
  if (inferredTitle) {
    return inferredTitle;
  }

  if (route.routePath === "/") {
    return "Home";
  }

  return route.pageName || route.routePath;
}
