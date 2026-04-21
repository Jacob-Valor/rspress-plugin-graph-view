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
