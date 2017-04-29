const service = require('./../index')({});
const bodyParser = require('body-parser');

// parse application/json 
service.use(bodyParser.json())

service.post('/echo', (req, res) => {
    res.send(JSON.stringify(req.body, null, 2))
});

// start the server
service.start();