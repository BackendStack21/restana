# REST-Ana
Super fast and minimalist web framework for building REST micro-services.

## Usage
```bash
npm i restana --save
```

```js
const service = require('restana')({});

const Pets = {
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

service.patch('/pets/:id', (req, res) => {
    res.send(this.update(req.params.id, JSON.stringify(req.body)));
}, PetsModel); // attaching this context

service.start(3000).then((server) => {});

// ... 
service.close().then(()=> {});
```

