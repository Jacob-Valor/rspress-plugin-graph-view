import * as path from "node:path";

const pluginDir = import.meta.dirname;
import type { RouteMeta, RspressPlugin } from "@rspress/core";
import {
  buildGraphModule,
  createGraphBuildCache,
  type CollectedRoute,
} from "./build";
import type { GraphViewColors } from "./runtime/GraphView";
import { normalizeRoutePath } from "./utils";

export type PanelPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface RspressPluginGraphViewOptions {
  defaultOpen?: boolean;
  profileBuild?: boolean;
  colors?: GraphViewColors;
  panelPosition?: PanelPosition;
  panelSize?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  initialZoom?: number;
  keyboardShortcut?: string;
}

export function pluginGraphview(
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
        path.join(pluginDir, "runtime", "GraphPanel.tsx"),
        {
          defaultOpen: options.defaultOpen ?? false,
          colors: options.colors,
          panelPosition: options.panelPosition ?? "bottom-right",
          panelSize: options.panelSize,
          initialZoom: options.initialZoom ?? 1,
          keyboardShortcut: options.keyboardShortcut ?? "g",
        },
      ],
    ],
  };
}

export default pluginGraphview;
