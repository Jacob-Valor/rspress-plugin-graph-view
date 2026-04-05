# API Reference

## Plugin Exports

### `default` — Plugin Factory

```ts
import graphView from 'rspress-plugin-graph-view';
```

Creates an Rspress plugin instance.

### `RspressPluginGraphViewOptions`

```ts
interface RspressPluginGraphViewOptions {
  defaultOpen?: boolean;
  profileBuild?: boolean;
}
```

`profileBuild` can also be enabled temporarily with the `RSPRESS_GRAPH_VIEW_PROFILE=1` environment variable.

## Related

- [Getting Started](./guide/getting-started.md)
- [Configuration](./guide/configuration.md)
- [Graph View](./guide/graph-view.md)
