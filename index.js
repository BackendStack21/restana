const http = require('http');

const methods = ['get', 'delete', 'patch', 'post', 'put', 'head', 'options'];
const extensions = {
  request: {},
  response: require('./libs/response-extensions')
};
const URL = require('url');

module.exports = (options = {}) => {
  const server = options.server || http.createServer();
  server.on('request', (req, res) => {
    app.handler(req, res);
  });
  const wayfarer = require('wayfarer')('/404');
  wayfarer.on('/404', () => 404);

  const routes = {};
  const middlewares = [];

  let app = {
    use: (middleware, context = {}) => {
      middlewares.push({
        handler: middleware,
        context
      });
    },
    route: (method, path, handler, ctx = {}) => {
      const key = `[${method.toUpperCase()}]${path}`;
      if (!routes[key]) {
        routes[key] = {
          method,
          path,
          handler,
          ctx
        };
        wayfarer.on(key, (params, req, res) => {
          try {
            req.params = params;
            const result = routes[key].handler.call(ctx, req, res, ctx);
            if (result instanceof Promise) {
              // async support
              result.catch(res.send);
            }
          } catch (err) {
            res.send(err);
          }
        });
      } else {
        routes[key].ctx = ctx;
        routes[key].handler = handler;
      }

      return routes[key];
    },
    handler: (req, res) => {
      for (const method of Object.keys(extensions.response)) {
        res[method] = extensions.response[method](req, res);
      }
      const url = URL.parse(req.url);
      req.path = url.path;
      req.query = url.query;
      req.search = url.search;

      // calling middlewares
      require('./libs/middleware-chain')(
        [
          ...middlewares.slice(0),
          {
            context: {},
            handler: (req, res, next) => {
              const route = `[${req.method.toUpperCase()}]${req.path}`;
              res.on('response', () => {
                next();
              });

              if (wayfarer(route, req, res) === 404) res.send(404);
            }
          }
        ],
        req,
        res
      )();
    },
    start: (port = 3000, host) =>
      new Promise((resolve, reject) => {
        server.listen(port, host, (err) => {
          if (err) reject(err);
          resolve(server);
        });
      }),
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          resolve();
        });
      }),
    routes: () => Object.keys(routes)
  };
  methods.forEach((method) => {
    app[method] = (path, handler, ctx) => app.route(method, path, handler, ctx);
  });

  return app;
};
