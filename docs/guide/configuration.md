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
    }),
  ],
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultOpen` | `boolean` | `false` | Open graph panel by default |

See also:
- [Getting Started](./getting-started.md)
- [API Reference](../api.md)
