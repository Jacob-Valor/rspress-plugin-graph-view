---
title: Graph View
---

# Graph View

The graph view shows how your documentation pages are connected through internal markdown links. Each page becomes a node, and each `[link](./path.md)` becomes an edge.

## Navigation

Click any node in the graph to navigate directly to that page. The graph uses Rspress's internal router, so navigation is instant — no full page reload.

## Current Page Highlighting

When you're on a page that exists in the graph, the panel:
- Highlights the current node with a pulsing indigo ring
- Shows only the current node and its direct neighbors (reduces visual noise)
- Dims unrelated nodes and links

If the current route isn't in the graph (e.g., a 404 page), the full graph is shown as a fallback.

## Hover Interactions

Hovering over a node:
- Highlights all connected nodes
- Dims unrelated nodes to 30% opacity
- Shows the connected link paths

This makes it easy to trace relationships between pages at a glance.

## Zoom Controls

The graph provides four zoom actions via the control panel in the bottom-right:

| Button | Action |
|--------|--------|
| `+` | Zoom in 30% |
| `−` | Zoom out 30% |
| `⤢` | Zoom to fit all visible nodes |
| `↺` | Reset to 1× zoom |

You can also pan by dragging and zoom with the scroll wheel.

## Large Graphs

For documentation sites with **80+ nodes** or **160+ links**, the graph automatically optimizes:
- Node sizes are reduced (6px max vs 8px)
- Labels are hidden unless you hover or zoom past 1.4×
- Animated link particles are disabled
- Physics simulation uses faster decay rates

These optimizations keep the graph interactive even with hundreds of nodes.

## Dark Mode

The graph automatically detects your theme and switches palettes:
- **Light mode**: slate-toned nodes with indigo accents
- **Dark mode**: brighter nodes with enhanced glow for visibility

Theme detection checks for:
- `<html class="dark">`
- `<html data-theme="dark">`
- Any parent element with `data-theme="dark"`

Changes are observed in real-time via `MutationObserver`, so switching themes while the graph is open updates colors instantly.

## Keyboard Accessibility

- **Escape** — closes the graph panel and returns focus to the FAB button
- **Tab** — navigates through zoom controls when the panel is open

## Performance

The graph build runs during Rspress's route scanning phase. For a typical site with 50 pages and 6 links per page:

- Cold build: ~15ms
- Warm rebuild (no changes): <1ms (fully cached)
- Single-file change: ~3ms (only modified file re-parsed)

You can benchmark your own site with `RSPRESS_GRAPH_VIEW_PROFILE=1` or run the synthetic benchmark:

```bash
bun run bench:graph --pages=1000 --links=6 --iterations=5
```

See also:
- [Getting Started](./getting-started.md)
- [Configuration](./configuration.md)
