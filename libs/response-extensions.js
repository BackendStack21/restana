module.exports.send = (req, res) => (data = 200, code = 200, headers = {}) => {
  res.setHeader('content-type', 'text/plain')
  Object.keys(headers).forEach((key) => {
    res.setHeader(key.toLowerCase(), headers[key])
  })

  return new Promise(async (resolve, reject) => {
    if (data instanceof Promise) data = await data

    if (data instanceof Error) {
      code = data.status || data.code || 500
      data = {
        errClass: data.constructor.name,
        code,
        message: data.message,
        data: data.data
      }
    } else if (typeof data === 'number') {
      code = parseInt(data, 10)
      data = res.body
    }

    // emit response event
    const params = {
      res,
      req,
      data,
      code
    }
    res.emit('response', params)

    if (typeof data === 'object') {
      res.setHeader('content-type', 'application/json')
      params.data = JSON.stringify(params.data)
    }

    res.writeHead(params.code)
    res.end(params.data, (err) => {
      if (err) reject(err)
      resolve()
    })
  })
}
