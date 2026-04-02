import type { RspressPlugin } from "@rspress/core";

export interface RspressPluginGraphViewOptions {}

export default function rspressPluginGraphView(
  options: RspressPluginGraphViewOptions = {},
): RspressPlugin {
  return {
    name: "rspress-plugin-graph-view",
    globalUIComponents: [],
  };
}
