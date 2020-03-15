---
description: The need for speed!
---

# restana

[![Build Status](https://travis-ci.org/jkyberneees/ana.svg?branch=master)](https://travis-ci.org/jkyberneees/ana) [![NPM version](https://img.shields.io/npm/v/restana.svg?style=flat)](https://www.npmjs.com/package/restana)  
Blazing fast, tiny and minimalist _connect-like_ web framework for building REST micro-services.

![Performance Benchmarks](.gitbook/assets/benchmark-30122019.png)

> MacBook Pro 2019, 2,4 GHz Intel Core i9, 32 GB 2400 MHz DDR4
>
> * wrk -t8 -c40 -d5s [http://127.0.0.1:3000/hi](http://127.0.0.1:3000/hi)

Read more: [_Building ultra-fast REST APIs with Node.js \(restana vs express vs fastify\)_](https://medium.com/@kyberneees/building-ultra-fast-rest-apis-with-node-js-and-restana-1d65b0d524b7)

## Usage

```bash
npm i restana --save
```

### Creating the service instance

Create unsecure HTTP server:

```javascript
const service = require('restana')()
```

Passing HTTP server instance:

```javascript
const https = require('https')
const service = require('restana')({
  server: https.createServer({
    key: keys.serviceKey,
    cert: keys.certificate
  })
})
```

> See examples:
>
> * [HTTPS service demo](https://github.com/jkyberneees/ana/tree/61326e0d941af5fbe087bc78d0b3df8c7da2eb36/demos/https-service.js)
> * [HTTP2 service demo](https://github.com/jkyberneees/ana/tree/61326e0d941af5fbe087bc78d0b3df8c7da2eb36/demos/http2-service.js)

### Configuration options

* `server`: Allows to optionally override the HTTP server instance to be used.
* `prioRequestsProcessing`: If `TRUE`, HTTP requests processing/handling is prioritized using `setImmediate`. Default value: `TRUE`
* `defaultRoute`: Optional route handler when no route match occurs. Default value: `((req, res) => res.send(404))`
* `errorHandler`: Optional global error handler function. Default value: `(err, req, res) => res.send(err)`
* `routerCacheSize`: The router matching cache size, indicates how many request matches will be kept in memory. Default value: `2000`

### Full service example

```javascript
const bodyParser = require('body-parser')

const service = require('restana')()
service.use(bodyParser.json())

const PetsModel = {
  // ... 
}

// registering service routes
service
  .get('/pets/:id', async (req, res) => {
    res.send(await PetsModel.findOne(req.params.id))
  })
  .get('/pets', async (req, res) => {
    res.send(await PetsModel.find())
  })
  .delete('/pets/:id', async (req, res) => {
    res.send(await PetsModel.destroy(req.params.id))
  })
  .post('/pets/:name/:age', async (req, res) => {
    res.send(await PetsModel.create(req.params))
  })
  .patch('/pets/:id', async (req, res) => {
    res.send(await PetsModel.update(req.params.id, req.body))
  })

service.get('/version', function (req, res) {
  // optionally you can send the response data in the body property
  res.body = { 
    version: '1.0.0'
  }
  // 200 is the default response code
  res.send() 
})
```

Supported HTTP methods:

```javascript
const methods = ['get', 'delete', 'put', 'patch', 'post', 'head', 'options', 'trace']
```

#### Using .all routes registration

You can also register a route handler for `all` supported HTTP methods:

```javascript
service.all('/allmethodsroute', (req, res) => {
  res.send(200)
})
```

#### Starting the service

```javascript
service.start(3000).then((server) => {})
```

#### Stopping the service

```javascript
service.close().then(()=> {})
```

### Async / Await support

```javascript
// some fake "star" handler
service.post('/star/:username', async (req, res) => {
  await starService.star(req.params.username)
  const stars = await starService.count(req.params.username)

  res.send({ stars })
})
```

### Sending custom headers:

```javascript
res.send('Hello World', 200, {
  'x-response-time': 100
})
```

### Acknowledge from low-level `end` operation

```javascript
res.send('Hello World', 200, {}, (err) => {
  if (err) {
    // upppsss
  }
})
```

### Global error handling

```javascript
const service = require('restana')({
  errorHandler (err, req, res) {
    console.log(`Something was wrong: ${err.message || err}`)
    res.send(err)
  }
})

service.get('/throw', (req, res) => {
  throw new Error('Upps!')
})
```

### Global middlewares

```javascript
const service = require('restana')()

service.use((req, res, next) => {
  // do something
  next()
});
...
```

### Prefix middlewares

```javascript
const service = require('restana')()

service.use('/admin', (req, res, next) => {
  // do something
  next()
});
...
```

### Route level middlewares

Connecting middlewares to specific routes is also supported:

```javascript
const service = require('restana')()

service.get('/admin', (req, res, next) => {
  // do something
  next()
}, (req, res) => {
  res.send('admin data')
});
...
```

### Nested routers

Nested routers are supported as well:

```javascript
const service = require('restana')()
const nestedRouter = service.newRouter()

nestedRouter.get('/hello', (req, res) => {
  res.send('Hello World!')
})
service.use('/v1', nestedRouter) 
...
```

In this example the router routes will be available under `/v1` prefix. For example: `GET /v1/hello`

#### Third party middlewares support:

> All middlewares using the `function (req, res, next)` signature format are compatible with restana.

Examples :

* **raw-body**: [https://www.npmjs.com/package/raw-body](https://www.npmjs.com/package/raw-body). See demo: [raw-body.js](https://github.com/jkyberneees/ana/tree/61326e0d941af5fbe087bc78d0b3df8c7da2eb36/demos/raw-body.js)
* **express-jwt**: [https://www.npmjs.com/package/express-jwt](https://www.npmjs.com/package/express-jwt). See demo: [express-jwt.js](https://github.com/jkyberneees/ana/tree/61326e0d941af5fbe087bc78d0b3df8c7da2eb36/demos/express-jwt.js)
* **body-parser**: [https://www.npmjs.com/package/body-parser](https://www.npmjs.com/package/body-parser). See demo: [body-parser.js](https://github.com/jkyberneees/ana/tree/61326e0d941af5fbe087bc78d0b3df8c7da2eb36/demos/body-parser.js)
* **swagger-tools**: [https://www.npmjs.com/package/swagger-tools](https://www.npmjs.com/package/swagger-tools). See demo: [swagger](https://github.com/jkyberneees/ana/tree/61326e0d941af5fbe087bc78d0b3df8c7da2eb36/demos/swagger/index.js)

#### Async middlewares support

Since version `v3.3.x`, you can also use async middlewares as described below:

```javascript
service.use(async (req, res, next) => {
  await next()
  console.log('All middlewares and route handler executed!')
}))
service.use(logging())
service.use(jwt())
...
```

In the same way you can also capture uncaught exceptions inside the request processing flow:

```javascript
service.use(async (req, res, next) => {
  try {
    await next()
  } catch (err) {
    console.log('upps, something just happened')
    res.send(err)
  }
})
service.use(logging())
service.use(jwt())
```

## AWS Serverless Integration

`restana` is compatible with the [serverless-http](https://github.com/dougmoscrop/serverless-http) library, so restana based services can also run as AWS lambdas 🚀

```javascript
// required dependencies
const serverless = require('serverless-http')
const restana = require('restana')

// creating service
const service = restana()
service.get('/hello', (req, res) => {
  res.send('Hello World!')
})

// lambda integration
const handler = serverless(app);
module.exports.handler = async (event, context) => {
  return await handler(event, context)
}
```

## Cloud Functions for Firebase Integration

`restana` restana based services can also run as Cloud Functions for Firebase 🚀

```javascript
// required dependencies
const functions = require("firebase-functions");
const restana = require('restana')

// creating service
const service = restana()
service.get('/hello', (req, res) => {
  res.send('Hello World!')
})

// lambda integration
exports = module.exports = functions.https.onRequest(app.callback());
```

## Serving static files

You can read more about serving static files with restana in this link: [https://thejs.blog/2019/07/12/restana-static-serving-the-frontend-with-node-js-beyond-nginx/](https://thejs.blog/2019/07/12/restana-static-serving-the-frontend-with-node-js-beyond-nginx/)

## Third party integrations

```javascript
// ...
const service = restana()
service.get('/hello', (req, res) => {
  res.send('Hello World!')
})

// using "the callback integrator" middleware
const server = http.createServer(service.callback())
//...
```

## Application Performance Monitoring \(APM\)

As a Node.js framework implementation based on the standard `http` module, `restana` benefits from out of the box instrumentation on existing APM agents such as:

* [https://www.npmjs.com/package/newrelic](https://www.npmjs.com/package/newrelic)
* [https://www.npmjs.com/package/elastic-apm-node](https://www.npmjs.com/package/elastic-apm-node)

### Elastic APM - Routes Naming

"Routes Naming" discovery is not supported out of the box by the Elastic APM agent, therefore we have created our custom integration.

```javascript
// getting the Elastic APM agent
const agent = require('elastic-apm-node').start({
  secretToken: process.env.APM_SECRET_TOKEN,
  serverUrl: process.env.APM_SERVER_URL
})

// creating a restana application
const service = require('restana')()

// getting restana APM routes naming plugin 
const apm = require('restana/libs/elastic-apm')
// attach route naming instrumentation before registering service routes
apm({ agent }).patch(service)

// register your routes or middlewares
service.get('/hello', (req, res) => {
  res.send('Hello World!')
})

// ...
```

### New Relic - Routes Naming

"Routes Naming" discovery is not supported out of the box by the New Relic APM agent, therefore we have created our custom integration.

```javascript
// getting the New Relic APM agent
const agent = require('newrelic')

// creating a restana application
const service = require('restana')()

// getting restana APM routes naming plugin 
const apm = require('restana/libs/newrelic-apm')
// attach route naming instrumentation before registering service routes
apm({ agent }).patch(service)

// register your routes or middlewares
service.get('/hello', (req, res) => {
  res.send('Hello World!')
})

// ...
```

## Performance comparison \(framework overhead\)

### Which is the fastest?

You can checkout `restana` performance index on the _**"Which is the fastest"**_ project: [https://github.com/the-benchmarker/web-frameworks\#full-table-1](https://github.com/the-benchmarker/web-frameworks#full-table-1)

## Using this project? Let us know 🚀

[https://goo.gl/forms/qlBwrf5raqfQwteH3](https://goo.gl/forms/qlBwrf5raqfQwteH3)

## Breacking changes

### 4.x:

> Restana version 4.x is much more simple to maintain, mature and faster!
>
> #### Added
>
> * Node.js v10.x+ is required.
> * `0http` sequential router is now the default and only HTTP router.
> * Overall middlewares support was improved.
> * Nested routers are now supported.
> * Improved error handler through async middlewares.
> * New `getRouter` and `newRouter` methods are added for accesing default and nested routers.
>
>   **Removed**
>
> * The `response` event was removed.
> * `find-my-way` router is replaced by `0http` sequential router.
> * Returning result inside async handler is not allowed anymore. Use `res.send...`
>
>   **3.x:**
>
>   **Removed**
>
>   * Support for `turbo-http` library was dropped.

