---
title: Configuration
---

# Configuration

Configure the graph view plugin in your `rspress.config.ts`:

```ts
import graphView from '@rspress/plugin-graph-view';

export default defineConfig({
  plugins: [
    graphView({
      defaultOpen: false,
      profileBuild: false,
    }),
  ],
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultOpen` | `boolean` | `false` | Open graph panel by default |
| `profileBuild` | `boolean` | `false` | Log graph build timings, cache hits, and module reuse during route scanning |

You can also enable build profiling ad hoc with `RSPRESS_GRAPH_VIEW_PROFILE=1`.

See also:
- [Getting Started](./getting-started.md)
- [API Reference](../api.md)
