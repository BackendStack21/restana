const service = require('./../index')({});
const jwt = require('express-jwt');

service.use(jwt({
    secret: 'shhhhhhared-secret'
}).unless({
    path: ['/login']
}));

service.get('/login', (req, res) => {
    res.send();
});

service.get('/protected', (req, res) => {
    res.send();
});

// start the server
service.start();