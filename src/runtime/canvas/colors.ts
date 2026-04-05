import type { GraphViewColors } from "../GraphView";

export const FONT_STACK =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export interface CanvasColors {
  currentNode: string;
  currentNodeGlow: string;
  currentNodeRing: string;
  currentLabel: string;
  node: string;
  nodeHover: string;
  nodeShadow: string;
  label: string;
  labelHover: string;
  link: string;
  linkHighlight: string;
  particleColor: string;
  gridDot: string;
  labelShadow: string;
  hoverRing: string;
  nodeGradLight: string;
  nodeGradHoverLight: string;
  fallbackLinkDim: string;
  loaderBorder: string;
  loaderTop: string;
}

export const LIGHT_COLORS: CanvasColors = {
  currentNode: "#6366f1",
  currentNodeGlow: "rgba(99, 102, 241, 0.25)",
  currentNodeRing: "rgba(129, 140, 248, 0.5)",
  currentLabel: "#6366f1",
  node: "#94a3b8",
  nodeHover: "#818cf8",
  nodeShadow: "rgba(15, 23, 42, 0.18)",
  label: "#64748b",
  labelHover: "#475569",
  link: "rgba(100, 116, 139, 0.35)",
  linkHighlight: "rgba(99, 102, 241, 0.55)",
  particleColor: "#818cf8",
  gridDot: "rgba(148, 163, 184, 0.12)",
  labelShadow: "rgba(0,0,0,0.12)",
  hoverRing: "rgba(129, 140, 248, 0.45)",
  nodeGradLight: "#b0bec5",
  nodeGradHoverLight: "#a5b4fc",
  fallbackLinkDim: "rgba(100, 116, 139, 0.1)",
  loaderBorder: "rgba(99, 102, 241, 0.2)",
  loaderTop: "#6366f1",
};

export const DARK_COLORS: CanvasColors = {
  currentNode: "#818cf8",
  currentNodeGlow: "rgba(129, 140, 248, 0.35)",
  currentNodeRing: "rgba(165, 180, 252, 0.5)",
  currentLabel: "#a5b4fc",
  node: "#64748b",
  nodeHover: "#818cf8",
  nodeShadow: "rgba(0, 0, 0, 0.3)",
  label: "#94a3b8",
  labelHover: "#cbd5e1",
  link: "rgba(148, 163, 184, 0.25)",
  linkHighlight: "rgba(129, 140, 248, 0.6)",
  particleColor: "#a5b4fc",
  gridDot: "rgba(148, 163, 184, 0.08)",
  labelShadow: "rgba(0,0,0,0.4)",
  hoverRing: "rgba(165, 180, 252, 0.5)",
  nodeGradLight: "#78909c",
  nodeGradHoverLight: "#93a5f8",
  fallbackLinkDim: "rgba(100, 116, 139, 0.08)",
  loaderBorder: "rgba(129, 140, 248, 0.2)",
  loaderTop: "#818cf8",
};

export function mergeColors(
  base: CanvasColors,
  overrides?: GraphViewColors,
): CanvasColors {
  if (!overrides) return base;
  return { ...base, ...overrides };
}
