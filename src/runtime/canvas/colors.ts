import type { GraphViewColors } from "../GraphView";

export const FONT_STACK =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export interface CanvasColors {
  currentNode: string;
  currentNodeGlow: string;
  currentNodeGlowFade: string;
  currentNodeRing: string;
  currentNodePulseRing: string;
  currentNodeGradLight: string;
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
  currentNodeGlowFade: "rgba(99, 102, 241, 0)",
  currentNodeRing: "rgba(129, 140, 248, 0.5)",
  currentNodePulseRing: "rgba(99, 102, 241, ALPHA)",
  currentNodeGradLight: "#a5b4fc",
  currentLabel: "#4338ca",
  node: "#94a3b8",
  nodeHover: "#818cf8",
  nodeShadow: "rgba(15, 23, 42, 0.18)",
  label: "#475569",
  labelHover: "#334155",
  link: "rgba(100, 116, 139, 0.35)",
  linkHighlight: "rgba(99, 102, 241, 0.55)",
  particleColor: "#818cf8",
  gridDot: "rgba(148, 163, 184, 0.18)",
  labelShadow: "rgba(255,255,255,0.9)",
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
  currentNodeGlowFade: "rgba(129, 140, 248, 0)",
  currentNodeRing: "rgba(165, 180, 252, 0.5)",
  currentNodePulseRing: "rgba(165, 180, 252, ALPHA)",
  currentNodeGradLight: "#c7d2fe",
  currentLabel: "#c7d2fe",
  node: "#64748b",
  nodeHover: "#818cf8",
  nodeShadow: "rgba(0, 0, 0, 0.3)",
  label: "#cbd5e1",
  labelHover: "#f1f5f9",
  link: "rgba(148, 163, 184, 0.25)",
  linkHighlight: "rgba(129, 140, 248, 0.6)",
  particleColor: "#a5b4fc",
  gridDot: "rgba(148, 163, 184, 0.12)",
  labelShadow: "rgba(15, 23, 42, 0.75)",
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
