---
title: Getting Started
---

# Getting Started

Welcome to **Rspress Graph View** — an interactive graph visualization plugin for [Rspress](https://rspress.dev/) documentation sites.

Think of it as [Obsidian's graph view](https://obsidian.md) for your docs. The plugin automatically extracts internal markdown links and renders them as a navigable force-directed graph, helping readers discover connections across your knowledge base.

## Prerequisites

- [Rspress](https://rspress.dev/) `^2.0.7` or later
- React `^19`

## Installation

Install the plugin alongside your existing Rspress setup:

```bash
bun add rspress-plugin-graph-view
# or
npm install rspress-plugin-graph-view
# or
pnpm add rspress-plugin-graph-view
```

## Quick Start

Add the plugin to your `rspress.config.ts`:

```ts
import { defineConfig } from "@rspress/core";
import { pluginGraphview } from "rspress-plugin-graph-view";

export default defineConfig({
  root: "docs",
  plugins: [pluginGraphview()],
});
```

That's it. Start your dev server and you'll see a floating action button in the bottom-right corner. Click it to open the graph view.

## How It Works

The plugin operates in two phases:

**Build time** — When Rspress generates routes, the plugin:
1. Collects all route metadata
2. Reads each `.md`/`.mdx` file
3. Extracts `[title](./path.md)` internal links
4. Resolves relative and absolute link targets
5. Builds a graph data structure and injects it as a virtual module

**Runtime** — The client:
1. Loads `react-force-graph-2d` dynamically (lazy-loaded)
2. Renders an interactive force-directed graph
3. Highlights the current page and its neighbors
4. Lets users click nodes to navigate between pages

## Features

- [Interactive force-directed graph](./graph-view.md) with custom canvas rendering
- [Click-to-navigate](./graph-view.md#navigation) — click any node to jump to that page
- [Dark mode](./graph-view.md#dark-mode) — seamlessly adapts to light and dark themes
- [Build caching](./configuration.md#caching) — incremental rebuilds with mtime-based invalidation
- [Large graph optimization](./graph-view.md#large-graphs) — automatically reduces visual cost for 80+ node graphs
- [Color customization](./configuration.md#custom-colors) — override the default palette to match your brand

See also:
- [Configuration](./configuration.md)
- [API Reference](../api.md)
