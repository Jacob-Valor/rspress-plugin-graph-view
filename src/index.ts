import * as path from "node:path";
import type { RouteMeta, RspressPlugin } from "@rspress/core";
import {
  buildGraphModule,
  createGraphBuildCache,
  type CollectedRoute,
} from "./build";
import type { GraphViewColors } from "./runtime/GraphView";

export interface RspressPluginGraphViewOptions {
  defaultOpen?: boolean;
  profileBuild?: boolean;
  colors?: GraphViewColors;
}

function normalizeRoutePath(routePath: string): string {
  const trimmed = routePath.replace(/\/$/, "");
  return trimmed || "/";
}

export default function rspressPluginGraphView(
  options: RspressPluginGraphViewOptions = {},
): RspressPlugin {
  let collectedRoutes: CollectedRoute[] = [];
  const graphBuildCache = createGraphBuildCache();
  const shouldProfileBuild =
    options.profileBuild ?? process.env.RSPRESS_GRAPH_VIEW_PROFILE === "1";

  return {
    name: "rspress-plugin-graph-view",

    routeGenerated(routes: RouteMeta[]) {
      collectedRoutes = routes.map((route) => ({
        routePath: normalizeRoutePath(route.routePath),
        absolutePath: route.absolutePath,
        relativePath: route.relativePath,
        pageName: route.pageName,
      }));
    },

    async addRuntimeModules() {
      const { moduleSource } = await buildGraphModule(collectedRoutes, graphBuildCache, {
        profile: shouldProfileBuild,
      });

      return {
        "virtual-graph-data": moduleSource,
      };
    },

    globalUIComponents: [
      [
        path.join(__dirname, "runtime", "GraphPanel.tsx"),
        {
          defaultOpen: options.defaultOpen ?? false,
          colors: options.colors,
        },
      ],
    ],
  };
}
