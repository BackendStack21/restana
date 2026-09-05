# Contributing

Restana requires Node.js 24 or newer.

```bash
npm ci
npm run check
```

Tests must listen on an ephemeral loopback port:

```js
const server = await service.start(0, '127.0.0.1')
```

Run response-path benchmarks before and after hot-path changes:

```bash
npm run bench
```

When changing the public API, update `index.d.ts`, `specs/types.test.ts`, the root
README, and `docs/README.md`. Security-sensitive behavior requires a regression
test. Performance claims require a repeatable benchmark rather than an isolated
micro-optimization result.

Keep changes focused and use Conventional Commit-style messages where practical.
