# Introduction
[![NPM version](https://badgen.net/npm/v/restana)](https://www.npmjs.com/package/restana)
[![NPM Total Downloads](https://badgen.net/npm/dt/restana)](https://www.npmjs.com/package/restana)
[![License](https://badgen.net/npm/license/restana)](https://www.npmjs.com/package/restana)
[![TypeScript support](https://badgen.net/npm/types/restana)](https://www.npmjs.com/package/restana)
[![Github stars](https://badgen.net/github/stars/BackendStack21/restana?icon=github)](https://github.com/BackendStack21/restana)

<img src="docs/restana-logo.svg" width="400">  

Restana is a lightweight and fast Node.js framework for building RESTful APIs. Inspired by Express, it provides a simple and intuitive API for routing, handling requests and responses, and middleware management. It is designed to be easy to use and integrate with other Node.js modules, allowing developers to quickly build scalable and maintainable APIs.

Read more online:  
- restana = faster and efficient Node.js REST APIs: https://itnext.io/restana-faster-and-efficient-node-js-rest-apis-1ee5285ce66

![Performance Benchmarks](docs/Benchmarks.png)
> Check it yourself: https://web-frameworks-benchmark.netlify.app/result?f=feathersjs,0http,koa,nestjs-express,express,sails,nestjs-fastify,restana


# Usage
Install
```bash
npm i restana
```
Create an HTTP API service:
```js
const restana = require('restana')

const service = restana()
service.get('/hi', (req, res) => res.send('Hello World!'))

service.start(3000)
```
Creating secure API service:
```js
const https = require('https')
const restana = require('restana')

const service = restana({
  server: https.createServer({
    key: keys.serviceKey,
    cert: keys.certificate
  })
})
service.get('/hi', (req, res) => res.send('Hello World!'))

service.start(3000)
```

Using `http.createServer()`:
```js
const http = require('http')
const restana = require('restana')

const service = restana()
service.get('/hi', (req, res) => res.send('Hello World!'))

http.createServer(service).listen(3000, '0.0.0.0')
```

# Security defaults
Restana ships with secure defaults out of the box:
- **Error handling**: The default error handler returns a generic `Internal Server Error` message, preventing internal details (stack traces, database errors, file paths) from leaking to clients. Provide a custom `errorHandler` to control what gets exposed.
- **Stream safety**: Stream errors are handled gracefully, preventing connection leaks.
- **Immutable config**: `getConfigOptions()` returns a frozen copy, preventing middleware from mutating internal framework options.
- **Response headers**: Browser hardening headers are enabled by default, and connection-specific or cookie headers cannot be injected through `res.send()`.
- **Proxy safety**: Forwarded protocol headers are ignored unless `trustProxy: true` is explicitly configured.

For local-only development, bind explicitly to loopback:
```js
service.start(3000, '127.0.0.1')
```

When TLS terminates at a trusted reverse proxy:
```js
const service = restana({ trustProxy: true })
```

Error details are hidden by default in every environment. For local debugging only, opt in with `debugErrors: true`; production mode always masks details.

## 6.1 highlights
- Reliable `start()` rejection on port and socket errors.
- Isolated, deeply frozen configuration snapshots.
- Boolean response bodies and array-valued headers.
- Correct `routerCacheSize: 0` behavior.
- Updated TypeScript API, reproducible installs, and route-scaling benchmarks.
- Expanded security and performance regression coverage.

# More
- Website and documentation: https://restana.21no.de
- [Full API guide](docs/README.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
