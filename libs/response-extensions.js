module.exports.send = (req, res) => (data = 200, code = 200, headers = {}) => {
  res.setHeader('content-type', 'text/plain');
  Object.keys(headers).forEach((key) => {
    res.setHeader(key.toLowerCase(), headers[key]);
  });

  return new Promise(async (resolve, reject) => {
    if (data instanceof Promise) data = await data;

    if (data instanceof Error) {
      code = data.status || data.code || 500;
      data = {
        code,
        message: data.message,
        data: data.data
      };
    }
    if (typeof data === 'number') {
      code = parseInt(data, 10);
      data = res.body;
    }
    if (typeof data === 'object') {
      res.setHeader('content-type', 'application/json');
      data = JSON.stringify(data);
    }

    // emit response event before send and terminate
    const params = {
      res,
      req,
      data,
      code
    };
    res.emit('response', params);

    res.writeHead(code);
    res.end(params.data, 'utf-8', (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};
