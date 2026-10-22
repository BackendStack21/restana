# Changelog

## 7.0.0

Breaking release. See the [migration guide](MIGRATION.md).

### Breaking
- Upgraded `0http` to 5.2 and made its dependency-free trie router the default. Matching is
  case-sensitive and stricter about route patterns. Set `caseSensitive: false` or
  `router: 'sequential'` for the previous behavior. `routerCacheSize` only applies to the sequential router.
- The default `errorHandler` responds the same way as `res.send(err)`. The status text matches the
  status code (`404 Not Found` instead of `404 Internal Server Error`), and `debugErrors` now applies
  to `next(err)` and thrown errors. Non-`Error` values are wrapped safely.
- `res.send(number)` treats only integers from 100 to 999 as status codes. Other numbers are sent
  as JSON bodies instead of being dropped.
- `package.json` `exports` limits imports to `restana`, `restana/libs/elastic-apm`,
  `restana/libs/newrelic-apm` and `restana/package.json`.
- TypeScript: route registration and `use()` return the object they were called on.
  `getConfigOptions()` returns `Readonly<Options>`, `errorHandler` is `readonly`, and
  `use(router)` without a prefix is no longer accepted.

### Added
- `router` option to select the `'trie'` (default) or `'sequential'` router.
- `caseSensitive` and `ignoreTrailingSlash` options for the trie router.
- Runtime `restana.Protocol` and `restana.Method` objects matching the TypeScript enums.
- TypeScript support for registering multiple middlewares in one `use()` call.
- Type declarations for the Elastic APM and New Relic integrations.
- TypeScript route parameter inference: `service.get('/users/:id', (req) => req.params.id)` and the
  `restana.RouteParams<Path>` helper type.
- `.nvmrc` pinning the supported Node.js major version for contributors.

### Performance
- The sequential router and its dependencies are loaded only when `router: 'sequential'` is selected,
  cutting `require('restana')` time by about 40% and the initial heap by about 0.5 MB.
- `res.send()` no longer registers a `finish` listener per response when no callback is passed.
- Security header options are resolved once per service instead of on every request.

### Fixed
- `res.send(undefined, code)` and promises resolving to `undefined` no longer drop the explicit status code.
- Non-numeric error codes (e.g. `'ENOENT'`) no longer mask a valid `err.statusCode`.
- APM instrumentation names multi-path routes per path instead of joining them (`GET /a,/b`).

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
