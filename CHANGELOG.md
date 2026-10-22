# Changelog

## Unreleased

### Changed
- Upgraded `0http` to 5.2 and made its dependency-free trie router the default. Static routes resolve
  in constant time and dynamic routes no longer depend on a match cache. Matching is case-sensitive by
  default; set `caseSensitive: false` or `router: 'sequential'` for the previous behavior
  ([differences](docs/README.md#routers)).

### Added
- `router` option to select the `'trie'` (default) or `'sequential'` router.
- `caseSensitive` and `ignoreTrailingSlash` options for the trie router.
- Runtime `restana.Protocol` and `restana.Method` objects matching the TypeScript enums.
- TypeScript support for registering multiple middlewares in one `use()` call.
- `.nvmrc` pinning the supported Node.js major version for contributors.

### Fixed
- `res.send(undefined, code)` and promises resolving to `undefined` no longer drop the explicit status code.
- Non-numeric error codes (e.g. `'ENOENT'`) no longer mask a valid `err.statusCode`.
- APM instrumentation names multi-path routes per path instead of joining them (`GET /a,/b`).
- TypeScript no longer accepts `use(router)` without a prefix, which throws at runtime.

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

### Removed
- Obsolete `disableResponseEvent` references.
- Install-time survey output, legacy Travis configuration, and a broken performance demo.

## 6.0.0

Security-focused release that introduced safe default errors, response-header validation,
default browser security headers, deeply frozen configuration, and opt-in TRACE support.

Earlier release notes remain available in [the full documentation](docs/README.md#breaking-changes).
