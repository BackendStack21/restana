'use strict'

const CONTENT_TYPE_HEADER = 'content-type'

/**
 * The friendly 'res.send' method
 * No comments needed ;)
 */
module.exports.send = (options, req, res) => (data = 200, code = 200, headers = null, cb = () => {}) => {
  if (headers !== null) {
    Object.keys(headers).forEach((key) => {
      res.setHeader(key.toLowerCase(), headers[key])
    })
  }

  if (typeof data === 'number') {
    code = parseInt(data, 10)
    data = res.body
  } else if (data instanceof Error) {
    const errorCode = data.status || data.code || data.statusCode
    code = typeof errorCode === 'number' ? parseInt(errorCode) : 500
    data = {
      code,
      message: data.message,
      data: data.data
    }
    res.setHeader(CONTENT_TYPE_HEADER, 'application/json')
  }

  if (typeof data === 'object' && data instanceof Buffer === false) {
    if (!res.hasHeader(CONTENT_TYPE_HEADER)) {
      res.setHeader(CONTENT_TYPE_HEADER, 'application/json')
    }
    data = JSON.stringify(data)
  }

  res.statusCode = code

  // finally end request
  res.end(data, cb)
}
