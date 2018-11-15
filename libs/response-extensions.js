module.exports.send = (req, res) => (data = 200, code = 200, headers = null, cb = () => {}) => {
  if (headers !== null) {
    Object.keys(headers).forEach((key) => {
      res.setHeader(key.toLowerCase(), headers[key])
    })
  }

  if (typeof data === 'number') {
    code = parseInt(data, 10)
    data = res.body
  } else if (data instanceof Error) {
    code = data.status || data.code || 500
    data = {
      errClass: data.constructor.name,
      code,
      message: data.message,
      data: data.data
    }
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
  res.statusCode = params.code

  // end request
  res.end(params.data, cb)
}
