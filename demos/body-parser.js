const service = require('./../index')({});
const bodyParser = require('body-parser');

// parse application/json 
service.use(bodyParser.json())

service.post('/echo', (req, res) => {
    res.setHeader('Content-Type', 'text/plain')
    res.write('You posted:\n')
    res.end(JSON.stringify(req.body, null, 2))
});

// start the server
service.start();