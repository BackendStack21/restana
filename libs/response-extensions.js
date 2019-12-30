const CONTENT_TYPE_HEADER = 'content-type'

/**
 * The friendly 'res.send' method
 * No comments needed ;)
 *
 * @param {Object} options Application configuration options
 * @param {Object} req Request object
 * @param {Object} res Response object
 */
module.exports.send = (options, req, res) => (data = 200, code = 200, headers = null, cb = () => {}) => {
  if (headers !== null) {
    // attach custom headers on the response
    Object.keys(headers).forEach((key) => {
      res.setHeader(key.toLowerCase(), headers[key])
    })
  }

  if (typeof data === 'number') {
    // shortcut was used, check if data payload was set in res.body
    code = parseInt(data, 10)
    data = res.body
  } else if (data instanceof Error) {
    // transparently supporting Error instances
    const errorCode = data.status || data.code || data.statusCode
    code = typeof errorCode === 'number' ? parseInt(errorCode) : 500
    data = {
      code,
      message: data.message,
      data: data.data
    }
    res.setHeader(CONTENT_TYPE_HEADER, 'application/json')
  }

  const params = {
    res,
    req,
    data,
    code
  }
  if (typeof data === 'object' && data instanceof Buffer === false) {
    if (!res.hasHeader(CONTENT_TYPE_HEADER)) {
      res.setHeader(CONTENT_TYPE_HEADER, 'application/json')
    }
    params.data = JSON.stringify(params.data)
  }

  // setting res.statusCode with post-processed result, developers might want to override here...
  res.statusCode = params.code

  // finally end request
  res.end(params.data, cb)
}
