# restana
[![Build Status](https://travis-ci.org/jkyberneees/ana.svg?branch=master)](https://travis-ci.org/jkyberneees/ana)
[![NPM version](https://img.shields.io/npm/v/restana.svg?style=flat)](https://www.npmjs.com/package/restana)  
Blazing fast, tiny and minimalist *connect-like* web framework for building REST micro-services.  
> Uses 'find-my-way' router: https://www.npmjs.com/package/find-my-way

What else?  *[Building ultra-fast REST APIs with Node.js (restana vs express vs fastify)](https://medium.com/@kyberneees/building-ultra-fast-rest-apis-with-node-js-and-restana-1d65b0d524b7)*

## Usage
```bash
npm i restana --save
```
### Creating the service instance
Create unsecure HTTP server:
```js
const service = require('restana')()
```
Passing HTTP server instance:
```js
const https = require('https')
const service = require('restana')({
    server: https.createServer({
        key: keys.serviceKey,
        cert: keys.certificate
    })
})
```

> See examples:
> * [HTTPS service demo](demos/https-service.js)
> * [HTTP2 service demo](demos/http2-service.js)

### Configuration
- `server`: Allows to override the HTTP server instance to be used.
- `routerFactory`: Router factory function to allow default `find-my-way` router override. 
- `prioRequestsProcessing`: If `TRUE`, HTTP requests processing/handling is prioritized using `setImmediate`. Default value: `TRUE`
- `ignoreTrailingSlash`: If `TRUE`, trailing slashes on routes are ignored. Default value: `FALSE`
- `allowUnsafeRegex`: If `TRUE`, potentially catastrophic exponential-time regular expressions are disabled. Default value: `FALSE`
- `maxParamLength`: Defines the custom length for parameters in parametric (standard, regex and multi) routes. Default value: `100`
- `defaultRoute`: Default route handler when no route match occurs. Default value: `((req, res) => res.send(404))`
- `disableResponseEvent`: If `TRUE`, there won't be `response` events triggered on the `res` object. Default value: `FALSE`

#### Example usage:
```js 
const service = require('restana')({
    ignoreTrailingSlash: true
});
```

#### Optionally roviding a router factory method:
> In this example we use `anumargak` router instead of `find-my-way`.
```js 
const anumargak = require('anumargak')
const service = require('restana')({
  routerFactory: (options) => {
    return anumargak(options)
  }
})
...
```
> Please consider that when using `anumargak` router, request params are accessible via: `req._path.params`

### Creating a micro-service & routes registration
```js
const bodyParser = require('body-parser')
service.use(bodyParser.json())

const PetsModel = {
    // ... 
}

// registering routes using method chaining
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
    res.body = { // optionally you can send the response data in the body property
        version: '1.0.0'
    };
    res.send() // 200 is the default response code
})
```
Supported HTTP methods:
```js
const methods = ['get', 'delete', 'put', 'patch', 'post', 'head', 'options', 'trace']
```

#### Using .all routes registration
You can also register a route handler for `all` supported HTTP methods:
```js
service.all('/allmethodsroute', function (req, res) {
    res.send(200)
})
```

#### Starting the service
```js
service.start(3000).then((server) => {})
```

#### Stopping the service
```js
service.close().then(()=> {})
```

### Async / Await support
```js
// some fake "star" handler
service.post('/star/:username', async (req, res) => {
    await starService.star(req.params.username)
    const stars = await starService.count(req.params.username)

    return stars
})
```
> IMPORTANT: Returned value can't be `undefined`, for such cases use `res.send(...`

### Route Level Middlewares
Connecting middlewares to specific routes is also supported:
```js
service.get('/hi/:name', async (req, res) => {
  return 'Hello ' + req.params.name // -> "name" will be uppercase here
}, {}, [(req, res, next) => {
  req.params.name = req.params.name.toUpperCase()
  next()
}]) // route middlewares can be passed in an Array after the handler context param
```
Express.js like signature also supported:
```js
service.get('/hi/:name', m1, m2, handler [, ctx])
```

### Sending custom headers:
```js
res.send('Hello World', 200, {
    'x-response-time': 100
})
```
### Acknowledge from low-level `end` operation
```js
res.send('Hello World', 200, {}, (err) => {
    if (err) {
        // upppsss
    }
})
```

### Middleware usage:
```js
const service = require('restana')({})

// custom middleware to attach the X-Response-Time header to the response
service.use((req, res, next) => {
    let now = new Date().getTime()

    res.on('response', e => {
        e.res.setHeader('X-Response-Time', new Date().getTime() - now)
    })

    return next()
});

// the /v1/welcome route handler
service.get('/v1/welcome', (req, res) => {
    res.send('Hello World!')
})

// start the server
service.start()
```

#### Error handling
```js
service.use((req, res, next) => {
    res.on('response', e => {
        if (e.code >= 400) {
            if (e.data && e.data.errClass) {
                console.log(e.data.errClass + ': ' + e.data.message)
            } else {
                console.log('error response, but not triggered by an Error instance')
            }
        }
    })

    return next()
});
```

Third party middlewares support:
> Almost all middlewares using the *function (req, res, next)* signature format should work, considering that no custom framework feature is used.

Examples :
* **raw-body**: [https://www.npmjs.com/package/raw-body](https://www.npmjs.com/package/raw-body). See demo: [raw-body.js](demos/raw-body.js)
* **express-jwt**: [https://www.npmjs.com/package/express-jwt](https://www.npmjs.com/package/express-jwt). See demo: [express-jwt.js](demos/express-jwt.js)
* **body-parser**: [https://www.npmjs.com/package/body-parser](https://www.npmjs.com/package/body-parser). See demo: [body-parser.js](demos/body-parser.js)

## AWS Serverless Integration
`restana` is compatible with the [serverless-http](https://github.com/dougmoscrop/serverless-http) library, so restana based services can also run as AWS lambdas 🚀
```js 
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

## Third party integrations
```js
// ...
const service = restana()
service.get('/hello', (req, res) => {
    res.send('Hello World!')
})

// using "the callback integrator" middleware
const server = http.createServer(service.callback())
//...
```

## turbo-http integration
What is turbo-http? Checkout: https://www.npmjs.com/package/turbo-http  
Using `turbo-http` in restana:
```bash
npm i turbo-http
```
```js
// ATTENTION: The performance of the service below can blow your mind ;)
const server = require('restana/libs/turbo-http')
const service = require('restana')({
    server
})

service.get('/hi', (req, res) => {
    res.send({
        msg: 'Hello World!'
    })
})

service.start()
```
> NOTE: When using `turbo-http`, the node.js `cluster` module can't be used!

## Performance comparison (framework overhead)
> measurements below refers to version 2.4

[Performance comparison](performance/) for a basic *Hello World!* response (single thread process).  
Node version: v10.14.1  
Laptop: MacBook Pro 2016, 2,7 GHz Intel Core i7, 16 GB 2133 MHz LPDDR3
```bash
wrk -t8 -c8 -d30s http://localhost:3000/hi
```
### String response ('Hello World!')
* **restana-turbo-http**: Requests/sec 57708.05
* **restana**: Requests/sec 46314.39
* **restana-cluster**: Requests/sec 70979.80
* fastify: Requests/sec 36873.05
* restify: Requests/sec 26388.94
* koa: Requests/sec 25686.12
* hapi: Requests/sec 20279.23
* express: Requests/sec 16812.15

### JSON response ({msg: 'Hello World!'})
* **restana-turbo-http**: Requests/sec 53544.21
* **restana**: Requests/sec 39363.91
* fastify: Requests/sec 33600.85
* restify: Requests/sec 29490.79
* koa: Requests/sec 23787.82
* hapi: Requests/sec 19404.48
* express: Requests/sec 15365.56

### Which is the fastest?
You can also checkout `restana` performance index on the ***"Which is the fastest"*** project: https://github.com/the-benchmarker/web-frameworks#full-table-1

## Using this project? Let us know 🚀
https://goo.gl/forms/qlBwrf5raqfQwteH3