# rspress-plugin-graph-view

Interactive graph visualization for [Rspress](https://rspress.dev/) documentation sites. Automatically extracts internal markdown links and renders them as a navigable force-directed graph — like Obsidian's graph view for your docs.

![Version](https://img.shields.io/npm/v/rspress-plugin-graph-view)
![License](https://img.shields.io/npm/l/rspress-plugin-graph-view)

## Features

- **Automatic link detection** — parses markdown links from your `.md`/`.mdx` files
- **Click to navigate** — click any node to jump to that page
- **Dark mode** — seamlessly adapts to light and dark themes
- **Build caching** — incremental rebuilds with mtime-based cache invalidation
- **Large graph optimization** — automatically disables expensive visual effects for graphs with 80+ nodes
- **Build profiling** — optional diagnostics to measure graph build performance

## Installation

```bash
bun add rspress-plugin-graph-view
# or
npm install rspress-plugin-graph-view
# or
pnpm add rspress-plugin-graph-view
```

## Usage

Add the plugin to your `rspress.config.ts`:

```ts
import { defineConfig } from "@rspress/core";
import graphView from "rspress-plugin-graph-view";

export default defineConfig({
  // ...your config
  plugins: [graphView()],
});
```

That's it. A floating action button will appear in the bottom-right corner of your docs site. Click it to open the graph view.

### Options

```ts
graphView({
  // Open the graph panel by default (default: false)
  defaultOpen: true,

  // Log build timing diagnostics (default: false)
  profileBuild: true,
})
```

You can also enable profiling temporarily with the `RSPRESS_GRAPH_VIEW_PROFILE=1` environment variable.

### Peer Dependencies

This plugin requires the following peer dependencies, which should already be installed if you're using Rspress:

| Package | Version |
| --- | --- |
| `@rspress/core` | `^2.0.7` |
| `react` | `>=18` |
| `react-dom` | `>=18` |
| `react-force-graph-2d` | `^1.29.1` |

## How It Works

1. **Build time**: The plugin collects all route metadata, reads each markdown file, extracts internal `[link](./path.md)` references, and builds a graph data structure.
2. **Runtime**: A virtual module (`virtual-graph-data`) injects the graph data into the client. `react-force-graph-2d` renders an interactive force-directed graph with custom canvas drawing.
3. **Caching**: File mtime + size signatures enable incremental rebuilds — unchanged files skip parsing entirely.

## Development

```bash
# Install dependencies
bun install

# Typecheck
bun run build

# Run tests
bun test

# Start docs dev server
bun run docs:dev

# Benchmark graph build performance
bun run bench:graph --pages=1000 --links=6 --iterations=5
```

## License

MIT
