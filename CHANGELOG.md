# Changelog

## 6.1.0

### Added
- Explicit `trustProxy` and `debugErrors` configuration.
- TypeScript declaration tests and performance smoke checks.
- Reproducible dependency installs through `package-lock.json`.

### Changed
- Listen failures now reject `service.start()` instead of escaping as unhandled errors.
- Error details are masked by default in every environment.
- Boolean bodies, array-valued headers, and `routerCacheSize: 0` behave as documented.
- Configuration snapshots clone and freeze nested arrays and circular plain objects.
- Stream failures use the configured error handler when a response can still be sent.
- Forwarded protocol headers require explicit proxy trust.
- Updated the router to `0http` 5 and refreshed development tooling.

### Removed
- Obsolete `disableResponseEvent` references.
- Install-time survey output, legacy Travis configuration, and a broken performance demo.

## 6.0.0

Security-focused release that introduced safe default errors, response-header validation,
default browser security headers, deeply frozen configuration, and opt-in TRACE support.

Earlier release notes remain available in [the full documentation](docs/README.md#breaking-changes).
