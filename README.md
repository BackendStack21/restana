# REST-Ana
Super fast and minimalist *connect-like* web framework for building REST micro-services.  
> Uses 'find-my-way' blazing fast router: https://www.npmjs.com/package/find-my-way

## Usage
```bash
npm i restana --save
```
### Creating the service instance
Create unsecure HTTP server:
```js
const service = require('restana')();
```
Passing HTTP server instance:
```js
const https = require('https');
const service = require('restana')({
    server: https.createServer({
        key: keys.serviceKey,
        cert: keys.certificate
    })
});
```

> See examples:
> * [HTTPS service demo](demos/https-service.js)
> * [HTTP2 service demo](demos/http2-service.js)

### Configuration
- `server`: Allows to override the HTTP server instance to be used.
- `ignoreTrailingSlash`: If `TRUE`, trailing slashes on routes are ignored. Default value: `FALSE`
- `allowUnsafeRegex`: If `TRUE`, potentially catastrophic exponential-time regular expressions are disabled. Default value: `FALSE`
- `maxParamLength`: Dfines the custom length for parameters in parametric (standard, regex and multi) routes. 

#### Example usage:
```js 
const service = require('restana')({
    ignoreTrailingSlash: true
});
```

### Creating the micro-service interface
```js
const PetsModel = {
    // ... 
};

service.get('/pets/:id', (req, res) => {
    res.send(PetsModel.findOne(req.params.id));
});

service.get('/pets', (req, res) => {
    res.send(PetsModel.find());
});

service.delete('/pets/:id', (req, res) => {
    res.send(PetsModel.destroy(req.params.id));
});

service.post('/pets/:name/:age', (req, res) => {
    res.send(PetsModel.create(req.params));
});

service.patch('/pets/:id', function (req, res) {
    res.send(this.update(req.params.id, JSON.stringify(req.body)));
}, PetsModel); // attaching this context

service.get('/version', function (req, res) {
    res.body = { // optionally you can send the response data in the body property
        version: '1.0.0'
    }
    res.send(); // 200 is the default response code
});
```
Supported HTTP methods:
```js
const methods = ['get', 'delete', 'put', 'patch', 'post', 'put', 'head', 'options'];
```

### Starting the service
```js
service.start(3000).then((server) => {});
```

### Stopping the service
```js
service.close().then(()=> {});
```

### Async / Await support
```js
// some fake "star" handler
service.post('/star/:username', async (req, res) => {
    const stars = await starService.star(req.params.username)
    return stars
});
```
> IMPORTANT: Returned value can't be `undefined`, for such cases use `res.send(...`

### Middleware usage:
```js
const service = require('restana')({});

// custom middleware to attach the X-Response-Time header to the response
service.use((req, res, next) => {
    let now = new Date().getTime();

    res.on('response', e => {
        e.res.setHeader('X-Response-Time', new Date().getTime() - now);
    });

    return next();
});

// the /v1/welcome route handler
service.get('/v1/welcome', (req, res) => {
    res.send('Hello World!');
});

// start the server
service.start();
```

#### Catching exceptions
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

    return next();
});
```

### Sending custom headers:
```js
res.send('Hello World', 200, {
    'x-response-time': 100
});
```

Third party middlewares support:
> Almost all middlewares using the *function (req, res, next)* signature format should work, considering that no custom framework feature is used.

Examples :
* **raw-body**: [https://www.npmjs.com/package/raw-body](https://www.npmjs.com/package/raw-body). See demo: [raw-body.js](demos/raw-body.js)
* **express-jwt**: [https://www.npmjs.com/package/express-jwt](https://www.npmjs.com/package/express-jwt). See demo: [express-jwt.js](demos/express-jwt.js)
* **body-parser**: [https://www.npmjs.com/package/body-parser](https://www.npmjs.com/package/body-parser). See demo: [body-parser.js](demos/body-parser.js)

## Performance comparison (framework overhead)
[Performance comparison](performance/)Performance comparison for a basic *Hello World!* response (single thread process).  
Node version: v10.4.0  
Laptop: MacBook Pro 2016, 2,7 GHz Intel Core i7, 16 GB 2133 MHz LPDDR3
```bash
wrk -t8 -c8 -d30s http://localhost:3000/hi
```
### String response ('Hello World!')
* polka: Requests/sec 37911.81
* fastify: Requests/sec 36894.86
* **restana**: Requests/sec 30066.89
* koa: Requests/sec 23486.64
* express: Requests/sec 16057.22

### JSON response ({msg: 'Hello World!'})
* fastify: Requests/sec 33143.12
* **restana**: Requests/sec 28083.14
* koa: Requests/sec 22485.43
* express: Requests/sec 14569.78
* polka: N/A - JSON response auto-detection no supported!