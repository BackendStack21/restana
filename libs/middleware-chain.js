const next = (middlewares, req, res, cb) => {
    let middleware = middlewares.shift();

    return () => {
        if (res.statusCode == 200 && !res.finished) {
            if (!middleware) return cb();
            else {
                try {
                    let result = middleware.handler.call(middleware.context || {}, req, res, next(middlewares, req, res, cb));
                    if (result instanceof Promise) { // async support
                        result.catch(res.send);
                    }
                } catch (err) {
                    res.send(err);
                }
            }
        } else if (!res.finished) {
            res.end();
        }
    }
}

module.exports = next;