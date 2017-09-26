const service = require('./../index')({});

// custom middleware to attach the X-Response-Time header to the response
service.use((req, res, next) => {
  const now = new Date().getTime();

  res.on('response', (data) => {
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
