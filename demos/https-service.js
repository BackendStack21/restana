/* eslint import/no-unresolved: 0 */

const https = require('https');
const pem = require('pem');

pem.createCertificate(
  {
    days: 1,
    selfSigned: true
  },
  (err, keys) => {
    const service = require('./../index')({
      server: https.createServer({
        key: keys.serviceKey,
        cert: keys.certificate
      })
    });

    service.get('/v1/welcome', (req, res) => {
      res.send('Hello World!');
    });

    service.start();
  }
);
