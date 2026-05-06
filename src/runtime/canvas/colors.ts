export const FONT_STACK = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

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

export type GraphViewColors = Partial<CanvasColors>;

export const LIGHT_COLORS: CanvasColors = {
  currentNode: "#a882ff",
  currentNodeGlow: "rgba(168, 130, 255, 0.15)",
  currentNodeGlowFade: "rgba(168, 130, 255, 0)",
  currentNodeRing: "rgba(168, 130, 255, 0.3)",
  currentNodePulseRing: "rgba(168, 130, 255, ALPHA)",
  currentNodeGradLight: "#a882ff",
  currentLabel: "#333333",
  node: "#a3a3a3",
  nodeHover: "#8b6ce3",
  nodeShadow: "rgba(0, 0, 0, 0)",
  label: "#666666",
  labelHover: "#111111",
  link: "rgba(163, 163, 163, 0.4)",
  linkHighlight: "rgba(168, 130, 255, 0.8)",
  particleColor: "#a882ff",
  gridDot: "rgba(0, 0, 0, 0.05)",
  labelShadow: "rgba(255, 255, 255, 0.8)",
  hoverRing: "rgba(139, 108, 227, 0.3)",
  nodeGradLight: "#a3a3a3",
  nodeGradHoverLight: "#8b6ce3",
  fallbackLinkDim: "rgba(163, 163, 163, 0.1)",
  loaderBorder: "rgba(168, 130, 255, 0.2)",
  loaderTop: "#a882ff",
};

export const DARK_COLORS: CanvasColors = {
  currentNode: "#a882ff",
  currentNodeGlow: "rgba(168, 130, 255, 0.2)",
  currentNodeGlowFade: "rgba(168, 130, 255, 0)",
  currentNodeRing: "rgba(168, 130, 255, 0.3)",
  currentNodePulseRing: "rgba(168, 130, 255, ALPHA)",
  currentNodeGradLight: "#a882ff",
  currentLabel: "#ffffff",
  node: "#878787",
  nodeHover: "#c2a3ff",
  nodeShadow: "rgba(0, 0, 0, 0)",
  label: "#999999",
  labelHover: "#ffffff",
  link: "rgba(135, 135, 135, 0.3)",
  linkHighlight: "rgba(168, 130, 255, 0.9)",
  particleColor: "#a882ff",
  gridDot: "rgba(255, 255, 255, 0.05)",
  labelShadow: "rgba(30, 30, 30, 0.8)",
  hoverRing: "rgba(194, 163, 255, 0.3)",
  nodeGradLight: "#878787",
  nodeGradHoverLight: "#c2a3ff",
  fallbackLinkDim: "rgba(135, 135, 135, 0.08)",
  loaderBorder: "rgba(168, 130, 255, 0.2)",
  loaderTop: "#a882ff",
};

export function mergeColors(base: CanvasColors, overrides?: GraphViewColors): CanvasColors {
  if (!overrides) return base;
  return { ...base, ...overrides };
}
