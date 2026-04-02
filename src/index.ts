import { readFile } from "node:fs/promises";
import * as path from "node:path";
import type { RouteMeta, RspressPlugin } from "@rspress/core";
import type { GraphData, GraphLink, GraphNode } from "./types";

export interface RspressPluginGraphViewOptions {
  defaultOpen?: boolean;
}

interface CollectedRoute {
  routePath: string;
  absolutePath: string;
  relativePath: string;
  pageName: string;
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
      !link.startsWith("tel:")
  );
}

function extractMarkdownLinks(source: string): string[] {
  const links: string[] = [];
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > 0 && source[index - 1] === "!") {
      continue;
    }

    const target = cleanLinkTarget(match[1] ?? "");
    if (isInternalDocLink(target)) {
      links.push(target);
    }
  }

  return links;
}

function extractDisplayTitle(source: string, fallback: string): string {
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

  return fallback;
}

function buildFileAliases(route: CollectedRoute): string[] {
  const aliases = new Set<string>();
  const absolute = path.normalize(route.absolutePath);
  aliases.add(absolute);

  const extension = path.extname(absolute);
  const withoutExtension = extension
    ? absolute.slice(0, -extension.length)
    : absolute;

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
  routeByFile: Map<string, CollectedRoute>
): CollectedRoute | undefined {
  if (rawLink.startsWith("/")) {
    const normalized = normalizeRoutePath(
      rawLink
        .replace(/\.(md|mdx)$/i, "")
        .replace(/\/index$/i, "")
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

export default function rspressPluginGraphView(
  options: RspressPluginGraphViewOptions = {},
): RspressPlugin {
  let collectedRoutes: CollectedRoute[] = [];

  return {
    name: "rspress-plugin-graph-view",

    routeGenerated(routes: RouteMeta[]) {
      collectedRoutes = routes.map((r) => ({
        routePath: normalizeRoutePath(r.routePath),
        absolutePath: r.absolutePath,
        relativePath: r.relativePath,
        pageName: r.pageName,
      }));
    },

    async addRuntimeModules() {
      const routeByPath = new Map<string, CollectedRoute>();
      const routeByFile = new Map<string, CollectedRoute>();
      const titleByRoute = new Map<string, string>();

      for (const route of collectedRoutes) {
        routeByPath.set(route.routePath, route);
        for (const alias of buildFileAliases(route)) {
          routeByFile.set(alias, route);
        }
      }

      const links: GraphLink[] = [];
      const seenLinks = new Set<string>();
      const degreeByRoute = new Map<string, number>();

      await Promise.all(
        collectedRoutes.map(async (route) => {
          const content = await readFile(route.absolutePath, "utf8");
          titleByRoute.set(
            route.routePath,
            extractDisplayTitle(content, makeNodeLabel(route))
          );
          const rawLinks = extractMarkdownLinks(content);

          for (const rawLink of rawLinks) {
            const targetRoute = resolveLinkedRoute(
              route.absolutePath,
              rawLink,
              routeByPath,
              routeByFile
            );

            if (!targetRoute) {
              continue;
            }

            const source = route.routePath;
            const target = targetRoute.routePath;
            const key = `${source}→${target}`;

            if (seenLinks.has(key)) {
              continue;
            }

            seenLinks.add(key);
            links.push({ source, target });
            degreeByRoute.set(source, (degreeByRoute.get(source) ?? 0) + 1);
            degreeByRoute.set(target, (degreeByRoute.get(target) ?? 0) + 1);
          }
        })
      );

      const nodes: GraphNode[] = collectedRoutes.map((route) => ({
        id: route.routePath,
        label: makeNodeLabel(route, titleByRoute.get(route.routePath)),
        routePath: route.routePath,
        val: Math.max(1, degreeByRoute.get(route.routePath) ?? 1),
      }));

      const graphData: GraphData = { nodes, links };

      return {
        "virtual-graph-data": `export const graphData = ${JSON.stringify(graphData)}; export default graphData;`,
      };
    },

    globalUIComponents: [
      [
        path.join(__dirname, "runtime", "GraphPanel.tsx"),
        { defaultOpen: options.defaultOpen ?? false },
      ],
    ],
  };
}
