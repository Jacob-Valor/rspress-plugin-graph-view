---
title: Graph View
---

# Graph View

The graph view shows how your documentation pages are connected through internal links.

When the current page exists in the generated graph, the panel focuses on that page and its directly connected neighbors. If the current route is missing, the plugin falls back to the full graph.

## How It Works

The plugin parses all markdown files during build time and extracts:
- **Nodes**: Each documentation page becomes a node
- **Edges**: Internal links between pages become connections

For larger graphs, the runtime reduces visual cost by hiding most labels until you zoom in and by disabling animated link particles.

Learn more about [configuration](./configuration.md) options.

Back to [Getting Started](./getting-started.md).
