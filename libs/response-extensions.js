module.exports.send = (req, res) => (data = 200, code = 200, headers = {}, cb = () => {}) => {
  Object.keys(headers).forEach((key) => {
    res.setHeader(key.toLowerCase(), headers[key])
  })

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

  if (typeof res.emit === 'function') {
    res.emit('response', params)
  }

  if (typeof data === 'object') {
    res.setHeader('content-type', 'application/json')
    params.data = JSON.stringify(params.data)
  } else {
    res.setHeader('content-type', 'text/plain')
  }

  res.statusCode = params.code
  res.end(params.data, cb)
}
