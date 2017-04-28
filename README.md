# REST-Ana
Super fast and minimalist web framework for building REST micro-services.

## Usage
```bash
npm i restana --save
```

```js
const service = require('restana')({});

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
    res.send(); // 200 is the defacult response code
});

service.start(3000).then((server) => {});

// ... 
service.close().then(()=> {});
```
Supported methods:
```js
const methods = ['get', 'delete', 'put', 'patch', 'post', 'put', 'head', 'options'];
```
Middleware usage:
```js
const service = require('restana')({});

// custom middleware to attach the X-Response-Time header to the response
service.use((req, res, next) => {
    let now = new Date().getTime();

    res.on('response', data => {
        data.res.setHeader('X-Response-Time', new Date().getTime() - now);
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