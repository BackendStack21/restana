module.exports.send = (req, res) => (data = 200, code = 200, headers = {}) => {
    res.setHeader('Content-Type', 'text/plain');

    return new Promise(async(resolve, reject) => {
        if (data instanceof Promise)
            data = await data;

        if (data instanceof Error) {
            code = data.status || data.code || 500;
            data = {
                code,
                message: data.message,
                data: data.data
            };
        }
        if ('number' == typeof data) {
            code = parseInt(data);
            data = res.body;
        }
        if ('object' == typeof data) {
            res.setHeader('Content-Type', 'application/json');
            data = JSON.stringify(data);
        }

        // emit response event before send and terminate
        let params = {
            res,
            req,
            data,
            code
        }
        res.emit('response', params);

        res.writeHead(code);
        res.end(params.data, 'utf-8', (err) => {
            if (err) reject(err);
            resolve();
        });
    });
};