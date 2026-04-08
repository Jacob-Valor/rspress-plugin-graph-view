# API Reference

## Plugin Exports

### `pluginGraphview` — Plugin Factory

```ts
import { pluginGraphview } from 'rspress-plugin-graph-view';
```

Creates an Rspress plugin instance. A default export alias is also available for backward compatibility:

```ts
import pluginGraphview from 'rspress-plugin-graph-view';
```

### `RspressPluginGraphViewOptions`

```ts
interface RspressPluginGraphViewOptions {
  defaultOpen?: boolean;
  profileBuild?: boolean;
  colors?: GraphViewColors;
}
```

`profileBuild` can also be enabled temporarily with the `RSPRESS_GRAPH_VIEW_PROFILE=1` environment variable.

## Related

- [Getting Started](./guide/getting-started.md)
- [Configuration](./guide/configuration.md)
- [Graph View](./guide/graph-view.md)
