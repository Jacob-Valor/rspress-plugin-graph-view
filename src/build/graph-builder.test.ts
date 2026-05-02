import { describe, expect, test } from "bun:test";
import type { ScannedRouteDocument } from "./cache";
import { buildGraphData } from "./graph-builder";
import type { CollectedRoute } from "./types";

function makeRoute(
  routePath: string,
  absolutePath: string,
  pageName = routePath.slice(1) || "index",
): CollectedRoute {
  return {
    routePath,
    absolutePath,
    relativePath: absolutePath.replace("/docs/", ""),
    pageName,
  };
}

function makeScannedDocument(
  route: CollectedRoute,
  rawLinks: string[],
  inferredTitle?: string,
): ScannedRouteDocument {
  return {
    route,
    mtimeMs: 1000,
    size: 100,
    contentHash: "abc123",
    inferredTitle,
    rawLinks,
  };
}

describe("buildGraphData", () => {
  test("resolves relative, extensionless, mdx, index, and absolute links", () => {
    const home = makeRoute("/", "/docs/index.md");
    const guide = makeRoute("/guide", "/docs/guide/index.md", "guide/index");
    const install = makeRoute("/guide/install", "/docs/guide/install.mdx", "guide/install");
    const api = makeRoute("/api", "/docs/api.mdx", "api");

    const graphData = buildGraphData(
      [home, guide, install, api],
      [
        makeScannedDocument(home, ["./guide", "./api.mdx"]),
        makeScannedDocument(guide, ["./install", "../api.mdx", "/index.md"]),
        makeScannedDocument(install, ["../index.md"]),
        makeScannedDocument(api, []),
      ],
    );

    expect(graphData.links).toEqual([
      { source: "/", target: "/guide" },
      { source: "/", target: "/api" },
      { source: "/guide", target: "/guide/install" },
      { source: "/guide", target: "/api" },
      { source: "/guide", target: "/" },
      { source: "/guide/install", target: "/" },
    ]);
  });

  test("skips broken links and deduplicates repeated links per route", () => {
    const source = makeRoute("/source", "/docs/source.md");
    const target = makeRoute("/target", "/docs/target.md");

    const graphData = buildGraphData(
      [source, target],
      [
        makeScannedDocument(source, ["./target.md", "./target", "/target/", "./missing.md"]),
        makeScannedDocument(target, []),
      ],
    );

    expect(graphData.links).toEqual([{ source: "/source", target: "/target" }]);
    expect(graphData.nodes.find((node) => node.id === "/source")?.val).toBe(1);
    expect(graphData.nodes.find((node) => node.id === "/target")?.val).toBe(1);
  });

  test("uses inferred titles first, then home and page name fallbacks", () => {
    const home = makeRoute("/", "/docs/index.md", "index");
    const titled = makeRoute("/custom", "/docs/custom.md", "custom-page");
    const fallback = makeRoute("/fallback", "/docs/fallback.md", "fallback-page");

    const graphData = buildGraphData(
      [home, titled, fallback],
      [
        makeScannedDocument(home, []),
        makeScannedDocument(titled, [], "Custom Title"),
        makeScannedDocument(fallback, []),
      ],
    );

    expect(graphData.nodes.map((node) => [node.id, node.label])).toEqual([
      ["/", "Home"],
      ["/custom", "Custom Title"],
      ["/fallback", "fallback-page"],
    ]);
  });
});
