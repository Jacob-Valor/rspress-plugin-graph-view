# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-05

### Added

- Dark mode support — graph colors automatically adapt to light and dark themes via `MutationObserver`
- Custom color palette via `colors` prop on `GraphPanel` — override any of 13 color keys
- Error boundary around ForceGraph renderer — graceful fallback if graph fails to load
- Keyboard accessibility — `Escape` closes panel and returns focus to FAB button
- Focus management — closing panel restores focus to the toggle button
- `prepublishOnly` script to ensure build and tests pass before publishing
- CI workflow for automated test and typecheck on push/PR

### Changed

- `react-force-graph-2d` moved from `dependencies` to `peerDependencies` — reduces install size for consumers
- Package `files` array corrected to `["src", "theme"]` (was referencing non-existent directories)
- `exports` field added for proper ESM resolution
- `main`, `module`, and `types` fields now point to `./src/index.ts`

### Fixed

- Graph build cache now correctly prunes stale routes when pages are deleted
- Module signature deduplication works regardless of route order
