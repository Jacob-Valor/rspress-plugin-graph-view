import * as path from "node:path";
import type { GraphData, GraphLink, GraphNode } from "../types";
import { normalizeRoutePath } from "../utils";
import type { ScannedRouteDocument } from "./cache";
import type { CollectedRoute } from "./types";

export function buildGraphData(
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
    const normalized = normalizeRoutePath(normalizeAbsoluteLinkTarget(rawLink));

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

function normalizeAbsoluteLinkTarget(rawLink: string): string {
  return (
    rawLink
      .replace(/\/+$/g, "")
      .replace(/\.(md|mdx)$/i, "")
      .replace(/\/index$/i, "") || "/"
  );
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
