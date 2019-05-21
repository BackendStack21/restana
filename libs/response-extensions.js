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
      // IMPORTANT: 'key.toLowerCase()' give us big performance gain
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
      errClass: data.constructor.name,
      code,
      message: data.message,
      data: data.data
    }
  }

  // emit response event to allow post-processing
  // TODO: We need to make this event notification async without affecting performance
  const params = {
    res,
    req,
    data,
    code
  }
  if (options.disableResponseEvent !== true) {
    res.emit('response', params)
  }

  if (typeof data === 'object' && data instanceof Buffer === false) {
    if (!res.hasHeader(CONTENT_TYPE_HEADER)) {
      // transparently setting the 'content-type' header if JSON
      res.setHeader(CONTENT_TYPE_HEADER, 'application/json')
    }
    params.data = JSON.stringify(params.data)
  }

  // setting res.statusCode with post-processed result, developers might want to override here...
  res.statusCode = params.code

  // finally end request
  res.end(params.data, cb)
}
