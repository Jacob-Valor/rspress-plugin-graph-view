# @rspress/plugin-graph-view

To install dependencies:

```bash
bun install
```

## Development

Run the typecheck build:

```bash
bun run build
```

Run tests:

```bash
bun test
```

Benchmark synthetic graph builds and cache reuse:

```bash
bun run bench:graph --pages=1000 --links=6 --iterations=5
```

Try a different synthetic graph shape:

```bash
bun run bench:graph --pages=1000 --links=6 --iterations=5 --shape=clustered
```

Write machine-readable output too:

```bash
bun run bench:graph --pages=1000 --links=6 --iterations=5 --json=./tmp/graph-bench.json --csv=./tmp/graph-bench.csv
```

What the benchmark reports:
- `cold`: fresh cache on every build
- `warm-cache`: unchanged rebuilds using the same cache
- `single-file-change`: incremental rebuilds after modifying one synthetic page

Useful flags:
- `--pages=<n>` number of synthetic docs to generate
- `--links=<n>` number of internal links per page
- `--iterations=<n>` measured runs per scenario
- `--shape=<sequential|ring|hub|clustered>` choose the synthetic graph topology
- `--json=<path>` write the full benchmark report as JSON
- `--csv=<path>` write summarized scenario rows as CSV

Shape modes:
- `sequential` preserves the original forward-linking benchmark pattern and remains the default
- `ring` links pages to nearby neighbors on both sides of the circle
- `hub` concentrates many links around the home page
- `clustered` keeps most links local with a few cross-cluster bridges

This project was created using `bun init` in bun v1.3.11. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
