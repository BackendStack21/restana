module.exports.send = (req, res) => (data, code = 200, headers = {}) => {
    headers['Content-Type'] = 'text/plain';

    return new Promise(async(resolve, reject) => {
        if (data instanceof Promise)
            data = await data;

        if (data instanceof Error) {
            code = data.code || 500;
            data = {
                code,
                message: data.message,
                data: data.data
            };
        }
        if ('number' == typeof data) {
            code = parseInt(data);
            data = null;
        } else if ('object' == typeof data) {
            headers['Content-Type'] = 'application/json';
            data = JSON.stringify(data);
        }

        res.writeHead(code, headers);
        res.end(data, 'utf-8', (err) => {
            if (err) reject(err);
            resolve();
        });
    });
};