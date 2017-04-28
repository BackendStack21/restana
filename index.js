const http = require("http");
const methods = ['get', 'delete', 'put', 'patch', 'post', 'put', 'head', 'options'];
const extensions = {
    request: {},
    response: require('./libs/response-extensions')
}
const URL = require("url");

module.exports = (options = {}) => {
    const server = http.createServer((req, res) => {
        app.handler(req, res);
    });
    const wayfarer = require('wayfarer')('/404');
    wayfarer.on('/404', () => 404);

    const routes = {};
    const middlewares = [];

    let app = {
        use: (middleware, context) => {
            middlewares.push({
                handler: middleware,
                context
            });
        },
        route: (method, path, handler, ctx = {}) => {
            let key = `[${method.toUpperCase()}]${path}`;
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
                        let result = routes[key].handler.call(ctx, req, res, ctx);
                        if (result instanceof Promise) { // async support
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
            for (let method of Object.keys(extensions.response)) {
                res[method] = extensions.response[method](req, res);
            }
            let url = URL.parse(req.url);
            req.path = url.path;
            req.query = url.query;
            req.search = url.search;

            let route = `[${req.method.toUpperCase()}]${req.path}`;

            // calling middlewares
            require('./libs/middleware-chain')(middlewares.slice(0), req, res, () => {
                let result = wayfarer(route, req, res);
                switch (result) {
                    case 404:
                        res.send(404);
                        break;

                    default:
                        break;
                }
            })();
        },
        start: (port = 3000, host) => {
            return new Promise((resolve, reject) => {
                server.listen(port, host, (err) => {
                    if (err) reject(err);
                    resolve(server);
                });
            });
        },
        close: () => {
            return new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        },
        routes: () => {
            return Object.keys(routes);
        }
    };
    methods.forEach(method => {
        app[method] = (path, handler, ctx) => {
            return app.route(method, path, handler, ctx);
        }
    });

    return app;
}