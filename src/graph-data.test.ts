import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildGraphModule,
  createGraphBuildCache,
  type CollectedRoute,
} from "./graph-data";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories
      .splice(0)
      .map((directoryPath) =>
        rm(directoryPath, { recursive: true, force: true }),
      ),
  );
});

describe("buildGraphModule", () => {
  test("reuses cached parse results and cached module output when routes are unchanged", async () => {
    const { routes } = await createFixtureDocs();
    const cache = createGraphBuildCache();
    const logs: string[] = [];

    const firstBuild = await buildGraphModule(routes, cache, {
      profile: true,
      logger: (message) => logs.push(message),
    });

    expect(firstBuild.graphData.nodes.map((node) => node.id)).toEqual([
      "/",
      "/guide",
    ]);
    expect(firstBuild.graphData.links).toEqual([
      { source: "/", target: "/guide" },
      { source: "/guide", target: "/" },
    ]);
    expect(firstBuild.diagnostics.cacheHits).toBe(0);
    expect(firstBuild.diagnostics.cacheMisses).toBe(2);
    expect(firstBuild.diagnostics.reusedModule).toBe(false);

    const secondBuild = await buildGraphModule(routes, cache, {
      profile: true,
      logger: (message) => logs.push(message),
    });

    expect(secondBuild.moduleSource).toBe(firstBuild.moduleSource);
    expect(secondBuild.diagnostics.cacheHits).toBe(2);
    expect(secondBuild.diagnostics.cacheMisses).toBe(0);
    expect(secondBuild.diagnostics.reusedModule).toBe(true);
    expect(logs).toHaveLength(2);
    expect(logs[1]).toContain("reusedModule=true");
  });

  test("invalidates only changed documents and updates graph metadata", async () => {
    const { routes, files } = await createFixtureDocs();
    const cache = createGraphBuildCache();

    await buildGraphModule(routes, cache);

    await new Promise((resolve) => setTimeout(resolve, 20));
    await writeFile(files.guidePath, "# Guide Updated\n\n[Home](./index.md)\n");

    const rebuiltGraph = await buildGraphModule(routes, cache);
    const guideNode = rebuiltGraph.graphData.nodes.find(
      (node) => node.id === "/guide",
    );

    expect(rebuiltGraph.diagnostics.cacheHits).toBe(1);
    expect(rebuiltGraph.diagnostics.cacheMisses).toBe(1);
    expect(rebuiltGraph.diagnostics.reusedModule).toBe(false);
    expect(guideNode?.label).toBe("Guide Updated");
  });

  test("reuses the cached module when route order changes without content changes", async () => {
    const { routes } = await createFixtureDocs();
    const cache = createGraphBuildCache();

    const firstBuild = await buildGraphModule(routes, cache);
    const reorderedBuild = await buildGraphModule([...routes].reverse(), cache);

    expect(reorderedBuild.moduleSource).toBe(firstBuild.moduleSource);
    expect(reorderedBuild.diagnostics.reusedModule).toBe(true);
    expect(reorderedBuild.diagnostics.cacheHits).toBe(2);
  });
});

async function createFixtureDocs(): Promise<{
  routes: CollectedRoute[];
  files: { indexPath: string; guidePath: string };
}> {
  const directoryPath = await mkdtemp(join(tmpdir(), "graph-view-cache-"));
  tempDirectories.push(directoryPath);

  const indexPath = join(directoryPath, "index.md");
  const guidePath = join(directoryPath, "guide.md");

  await writeFile(indexPath, "# Home\n\n[Guide](./guide.md)\n");
  await writeFile(guidePath, "# Guide\n\n[Home](./index.md)\n");

  return {
    routes: [
      {
        routePath: "/",
        absolutePath: indexPath,
        relativePath: "index.md",
        pageName: "index",
      },
      {
        routePath: "/guide",
        absolutePath: guidePath,
        relativePath: "guide.md",
        pageName: "guide",
      },
    ],
    files: {
      indexPath,
      guidePath,
    },
  };
}
