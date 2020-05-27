'use strict'

const { forEachObject } = require('./utils')

const CONTENT_TYPE_HEADER = 'content-type'
const TYPE_JSON = 'application/json; charset=utf-8'
const TYPE_PLAIN = 'text/plain; charset=utf-8'
const TYPE_OCTET = 'application/octet-stream'

const NOOP = () => {}

const stringify = (obj) => {
  // ToDo: fast json stringify ?
  return JSON.stringify(obj)
}

const preEnd = (res, contentType, statusCode) => {
  if (contentType) {
    res.setHeader(CONTENT_TYPE_HEADER, contentType)
  }
  res.statusCode = statusCode
}

const parseErr = (error) => {
  const errorCode = error.status || error.code || error.statusCode
  const statusCode = typeof errorCode === 'number' ? parseInt(errorCode) : 500

  return {
    statusCode,
    data: stringify({
      code: statusCode,
      message: error.message,
      data: error.data
    })
  }
}

/**
 * The friendly 'res.send' method
 * No comments needed ;)
 */
module.exports.send = (options, req, res) => {
  return (data = 200, code = 200, headers = null, cb = NOOP) => {
    let contentType

    if (data instanceof Error) {
      const err = parseErr(data)
      contentType = TYPE_JSON
      code = err.statusCode
      data = err.data
    } else {
      if (headers && typeof headers === 'object') {
        forEachObject(headers, (value, key) => {
          res.setHeader(key.toLowerCase(), value)
        })
      }

      // NOTE: only retrieve content-type after setting custom headers
      contentType = res.getHeader(CONTENT_TYPE_HEADER)

      if (typeof data === 'number') {
        code = parseInt(data, 10)
        data = res.body
      }

      if (data) {
        if (typeof data === 'string') {
          if (!contentType) contentType = TYPE_PLAIN
        } else if (typeof data === 'object') {
          if (data instanceof Buffer) {
            if (!contentType) contentType = TYPE_OCTET
          } else if (typeof data.pipe === 'function') {
            if (!contentType) contentType = TYPE_OCTET

            // NOTE: we exceptionally handle the response termination for streams
            preEnd(res, contentType, code)

            data.pipe(res)
            data.on('end', cb)

            return
          } else {
            if (!contentType) contentType = TYPE_JSON
            data = stringify(data)
          }
        }
      }
    }

    preEnd(res, contentType, code)
    res.end(data, cb)
  }
}
