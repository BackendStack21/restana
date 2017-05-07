const http2 = require('http2');
const pem = require('pem');

pem.createCertificate({
    days: 1,
    selfSigned: true
}, (err, keys) => {
    const service = require('./../index')({
        server: http2.createServer({
            key: keys.serviceKey,
            cert: keys.certificate
        })
    });

    service.get('/v1/welcome', (req, res) => {
        res.send('Hello World!');
    });

    service.start();
});