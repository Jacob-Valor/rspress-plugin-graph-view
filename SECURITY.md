# Security Policy

## Supported Versions

Only the latest published version on npm receives security fixes.

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < latest | :x:              |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

To report a vulnerability, email **jacob-programmer@tuta.io** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Any suggested mitigations (optional)

You can expect an acknowledgement within **72 hours**. If the issue is confirmed, a fix will be prioritized and a patched release will be published as soon as possible (typically within 7 days for high/critical severity).

Once a fix is released, the vulnerability may be disclosed publicly after a reasonable patch window (typically 30 days) to allow downstream users to update.

## Scope

This policy covers the `rspress-plugin-graph-view` npm package and its source code in this repository. Vulnerabilities in peer dependencies (`@rspress/core`, `react`, `react-force-graph-2d`) should be reported to their respective maintainers.

## Security Practices

- npm provenance attestation is enabled — every published version is cryptographically linked to its source commit and CI workflow
- GitHub Actions are pinned to full commit SHAs to prevent dependency substitution attacks
- Dependabot is configured to automatically open PRs for dependency updates (both npm and GitHub Actions)
- CI enforces `--frozen-lockfile` installs to prevent lockfile drift
- CI runs `bun audit --production` before tests and release publishing

## Accepted Upstream Toolchain Risks

The project may inherit security scanner alerts from upstream build tooling that cannot be safely removed without a major toolchain migration.

### Accepted risk: `@emnapi/core` `uses eval`

- Status: accepted upstream toolchain risk
- Reviewed: 2026-04-23
- Current transitive path: `@rspress/core` → `@rsbuild/core` → `@rspack/core` → `@rspack/binding-wasm32-wasi` → `@napi-rs/wasm-runtime` → `@emnapi/core`
- Current lockfile version in this repository: `@emnapi/core@1.10.0`

Rationale:

- Socket flags `@emnapi/core` for dynamic execution (`eval` / `new Function`) in its published runtime bundle.
- This package is not a direct dependency of `rspress-plugin-graph-view`; it is introduced by the upstream Rspress/Rsbuild/Rspack WASM toolchain.
- Reviewing adjacent upstream versions does not remove this alert class, so a local override is unlikely to help.
- Replacing this dependency path would require a larger upstream toolchain migration with materially higher breakage risk than the alert itself.

Mitigation policy:

- Keep the Rspress/Rsbuild/Rspack toolchain updated through normal dependency maintenance.
- Re-evaluate this accepted risk whenever upstream packages remove the `@emnapi/core` path or publish a version that eliminates the dynamic execution pattern.
- Treat any new behavior beyond the known `uses eval` finding as a fresh incident and re-investigate immediately.

### Accepted risk: `@emnapi/core` `network access`

- Status: accepted upstream toolchain risk
- Reviewed: 2026-04-23
- Current transitive path: `@rspress/core` → `@rsbuild/core` → `@rspack/core` → `@rspack/binding-wasm32-wasi` → `@napi-rs/wasm-runtime` → `@emnapi/core`
- Current lockfile version in this repository: `@emnapi/core@1.10.0`

Rationale:

- Socket flags `@emnapi/core` for network access because its published runtime supports loading WebAssembly from a string URL or `URL` object via `fetch(...)`.
- This behavior is part of the package's documented browser/WASM loading API and is not evidence of exfiltration or background network activity.
- In this repository's normal Rspress/Rspack build path, `@emnapi/core` is used transitively as part of the upstream WASM toolchain and the `fetch` branch is not expected to execute during ordinary plugin development workflows.
- Adjacent upstream versions keep the same WebAssembly loading pattern, so a local version override is unlikely to remove the alert class safely.

Mitigation policy:

- Keep the Rspress/Rsbuild/Rspack toolchain updated through normal dependency maintenance.
- Re-evaluate this accepted risk whenever upstream packages remove URL-based WASM loading or eliminate the `@emnapi/core` path from the toolchain.
- Treat any unexpected outbound network behavior beyond the known optional `fetch(...)` loading path as a fresh incident and re-investigate immediately.

### Accepted risk: `react-render-to-markdown` `unpopular package`

- Status: accepted upstream toolchain risk
- Reviewed: 2026-04-23
- Current transitive path: `@rspress/core` → `react-render-to-markdown@19.0.1`
- Local docs config note: this repository's `rspress.config.ts` does not enable the `llms` feature that consumes this package.

Rationale:

- Socket flags `react-render-to-markdown` as an unpopular package because it is a niche React-to-Markdown renderer with relatively low ecosystem adoption.
- The package appears to be a legitimate open-source dependency used by `@rspress/core` for its LLM/Markdown export pipeline rather than a suspicious or abandoned package.
- This repository does not depend on it directly; it is pulled in by upstream Rspress internals.
- Removing it locally would require replacing or forking upstream `@rspress/core`, which is materially riskier than accepting the popularity-based alert.

Mitigation policy:

- Keep `@rspress/core` updated through normal dependency maintenance.
- Re-evaluate this accepted risk if Rspress removes or replaces `react-render-to-markdown`, or if the package shows signs of abandonment or suspicious publication activity.
- Treat any new security-relevant behavior from this package as a fresh incident and re-investigate immediately.

### Accepted risk: `@mdx-js/mdx` `URL strings`

- Status: accepted upstream toolchain risk
- Reviewed: 2026-04-23
- Current transitive path: `@rspress/core` → `@mdx-js/mdx@3.1.1`

Rationale:

- Socket flags `@mdx-js/mdx` for URL strings because the published compiler bundle includes official MDX migration-guide links in developer-facing error and deprecation messages.
- The flagged URLs point to the package's own documentation site (`mdxjs.com`) and are not dynamic fetch targets, install scripts, or telemetry endpoints.
- `@mdx-js/mdx` is a normal transitive dependency of `@rspress/core` for MDX compilation and cannot be removed locally without breaking the upstream framework.
- Adjacent upstream versions keep the same documentation-link pattern, so a local override is unlikely to remove the alert class safely.

Mitigation policy:

- Keep `@rspress/core` and its MDX toolchain updated through normal dependency maintenance.
- Re-evaluate this accepted risk if upstream `@mdx-js/mdx` removes or materially changes the documented URL-string behavior.
- Treat any new URL usage beyond static documentation references as a fresh incident and re-investigate immediately.
