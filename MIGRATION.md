# Migrating from restana 6.x to 7.0

Restana 7.0 makes the faster trie router the default, gives errors consistent
responses, and tightens the package's public API. Most applications upgrade by
changing the dependency version and checking the items below.

Requirements are unchanged: Node.js 24 or newer.

```bash
npm i restana@^7
```

## Quick checklist

| If your application… | Then… |
| --- | --- |
| relies on case-insensitive paths (`/Users` matching `/users`) | set `caseSensitive: false` |
| depends on the exact matching rules of the 6.x router | set `router: 'sequential'` |
| sets `routerCacheSize` | set `router: 'sequential'` too, or remove the option |
| asserts `message: 'Internal Server Error'` on non-500 errors | expect the standard status text, e.g. `'Not Found'` |
| calls `res.send(number)` with a number that is not an HTTP status code | expect it to be sent as a JSON body |
| imports internal modules such as `restana/libs/utils` | use only the public entry points listed below |
| uses the TypeScript declarations | see [TypeScript](#typescript) |

## Trie router is the default

Restana now uses the dependency-free [0http](https://github.com/BackendStack21/0http)
trie router (0http 5.2). Static routes resolve in constant time and dynamic
routes stay fast as the route count grows, with no route match cache to size.

The trie router intentionally differs from the 6.x sequential router:

- **Paths are case-sensitive.** `GET /Admin` no longer matches a route registered as `/admin`.
  This agrees with how most reverse proxies, WAFs and auth layers classify paths.
- **Invalid patterns fail fast.** A `*` that is not the last segment, or a `?` that is not the
  last character of a param segment, throws when the route is registered.
- **Absent optional params are omitted.** For `/users/:id?`, a request to `/users` leaves
  `req.params.id` out instead of setting it to `undefined`.
- **Trailing wildcards match the bare prefix.** `/files/*` also matches `/files`, with
  `req.params['*']` equal to `''`.
- **Empty route segments are ignored.** A route registered as `/a//b` is the same as `/a/b`.
- **Request paths must start with `/`.** Other request targets match nothing and get a 404.

New options control the trie router:

```js
const service = restana({
  caseSensitive: false, // match '/Users' and '/users' (ASCII letters only); default: true
  ignoreTrailingSlash: true // '/users/' is the same path as '/users'; default: true
})
```

To keep the 6.x behavior exactly, select the sequential router:

```js
const service = restana({ router: 'sequential', routerCacheSize: 2000 })
```

`routerCacheSize` only applies to the sequential router. The trie router ignores it.

## Error responses

The default `errorHandler` now responds the same way as `res.send(err)`. The
status text in the response matches the status code, and `debugErrors` applies to
errors passed to `next(err)` or thrown from handlers.

```js
service.get('/users/:id', async () => {
  throw Object.assign(new Error('user 42 not in db'), { status: 404 })
})
```

| | 6.x | 7.0 |
| --- | --- | --- |
| default | `404 {"code":404,"message":"Internal Server Error"}` | `404 {"code":404,"message":"Not Found"}` |
| `debugErrors: true` (non-production) | `404 {"code":404,"message":"Internal Server Error"}` | `404 {"code":404,"message":"user 42 not in db"}` |
| `NODE_ENV=production` | `404 {"code":404,"message":"Internal Server Error"}` | `404 {"code":404,"message":"Not Found"}` |

Error details stay masked unless you opt in with `debugErrors: true`. They are
always masked when `NODE_ENV=production`.

Values passed to `next()` that are not `Error` instances, such as `next('oops')`,
are wrapped in an `Error`. The response is a generic
`500 Internal Server Error`, or uses the value's numeric `status`, `code` or
`statusCode`. With `debugErrors: true`, the original value is shown in `data`.

Custom `errorHandler` functions are not affected.

To keep the 6.x response body, provide your own handler:

```js
const service = restana({
  errorHandler (err, req, res) {
    const code = [err.status, err.code, err.statusCode].find(Number.isInteger) || 500
    res.send({ code, message: 'Internal Server Error' }, code)
  }
})
```

## `res.send()` with numbers

A number is treated as a status code only when it is an integer from 100 to 999.
Other numbers are sent as JSON instead of being dropped:

```js
res.send(404) // 404 with an empty body, unchanged
res.send(42.5) // 6.x: 200 with an empty body; 7.0: 200 with body 42.5 (application/json)
res.send(0, 201) // 6.x: 201 with an empty body; 7.0: 201 with body 0
```

`res.send(undefined, code)` now keeps the status code you pass. Previously it
was overwritten by `res.statusCode`.

## Package entry points

`package.json` now has an `exports` map. Only these entry points can be imported:

- `restana`
- `restana/libs/elastic-apm`
- `restana/libs/newrelic-apm`
- `restana/package.json`

Deep imports of internal modules, such as `restana/libs/utils` or
`restana/libs/response-extensions`, now fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
If you relied on one of them, copy the code you need or open an issue describing
your use case.

## TypeScript

- Route registration methods (`get`, `post`, …, `all`, `trace`) and `use()` now return the
  object they were called on. Chaining on a router created by `newRouter()` now returns the
  router, not a `Service`.
- `use()` accepts several middlewares: `service.use(cors, auth)` and
  `service.use('/api', cors, auth)`.
- `use(router)` without a prefix is no longer accepted, because it threw at runtime. Mount
  nested routers with a prefix: `service.use('/api', router)`.
- `getConfigOptions()` returns `Readonly<Options>`, and `service.errorHandler` is `readonly`.
  Both already were at runtime.
- `Router.id` is always defined.
- `RegisterRoute<P, R = Service<P>>` takes an optional second type parameter for the return type.
- New options are typed: `router`, `caseSensitive` and `ignoreTrailingSlash`.
- `restana.Protocol` and `restana.Method` now exist at runtime, so `restana.Protocol.HTTP2`
  works in value positions too.
- `restana/libs/elastic-apm` and `restana/libs/newrelic-apm` now ship type declarations.

## Other fixes

- Error status codes are taken from the first valid value of `err.status`, `err.code` or
  `err.statusCode`. A Node.js system error code such as `'ENOENT'` no longer hides a valid
  `statusCode`.
- APM integrations name routes registered with several paths, `service.get(['/a', '/b'], …)`,
  one path at a time (`GET /a`, `GET /b`) instead of joining them (`GET /a,/b`).
