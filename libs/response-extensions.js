'use strict'

const { forEachObject } = require('./utils')

const CONTENT_TYPE_HEADER = 'content-type'
const TYPE_JSON = 'application/json; charset=utf-8'
const TYPE_PLAIN = 'text/plain; charset=utf-8'
const TYPE_OCTET = 'application/octet-stream'

const NOOP = () => { }

//
// Headers that MUST NOT be set via the res.send() headers parameter.
// These should only be managed by the framework or explicitly via res.setHeader().
//
const FORBIDDEN_HEADERS = new Set([
  'transfer-encoding',
  'content-length',
  'connection',
  'keep-alive',
  'host',
  'set-cookie'
])

const stringify = obj => {
  return JSON.stringify(obj)
}

const STATUS_TEXTS = require('http').STATUS_CODES

const beforeEnd = (res, contentType, statusCode, data) => {
  if (contentType) {
    res.setHeader(CONTENT_TYPE_HEADER, contentType)
  }
  res.statusCode = statusCode
}

const isProduction = () => process.env.NODE_ENV === 'production'

const parseErr = error => {
  const errorCode = error.status || error.code || error.statusCode
  const statusCode = typeof errorCode === 'number' ? errorCode : 500

  if (isProduction()) {
    return {
      statusCode,
      data: stringify({
        code: statusCode,
        message: STATUS_TEXTS[statusCode] || 'Internal Server Error'
      })
    }
  }

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
const MAX_PROMISE_DEPTH = 3

module.exports.send = (options, req, res) => {
  const send = (data = res.statusCode, code = res.statusCode, headers = null, cb = NOOP, _promiseDepth = 0) => {
    let contentType

    if (data instanceof Error) {
      const err = parseErr(data)
      contentType = TYPE_JSON
      code = err.statusCode
      data = err.data
    } else {
      if (headers && typeof headers === 'object') {
        forEachObject(headers, (value, key) => {
          // Block forbidden headers (hop-by-hop, security-sensitive)
          if (typeof key !== 'string' || FORBIDDEN_HEADERS.has(key.toLowerCase())) {
            return
          }
          // Sanitize array values — prevent header injection via arrays
          if (Array.isArray(value)) {
            return
          }
          try {
            res.setHeader(key.toLowerCase(), value)
          } catch (e) {
            // Silently skip invalid headers (e.g. CRLF in key or value)
          }
        })
      }

      // NOTE: only retrieve content-type after setting custom headers
      contentType = res.getHeader(CONTENT_TYPE_HEADER)

      if (typeof data === 'number') {
        code = data
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
            beforeEnd(res, contentType, code, data)

            data.pipe(res)
            data.on('end', cb)
            data.on('error', () => {
              res.end(cb)
            })

            return
          } else if (Promise.resolve(data) === data) { // http://www.ecma-international.org/ecma-262/6.0/#sec-promise.resolve
            if (_promiseDepth >= MAX_PROMISE_DEPTH) {
              data = stringify({ code: 500, message: 'Internal Server Error' })
              contentType = TYPE_JSON
              code = 500
            } else {
              headers = null
              return data
                .then(resolved => send(resolved, code, headers, cb, _promiseDepth + 1))
                .catch(err => send(err, code, headers, cb, _promiseDepth + 1))
            }
          } else {
            if (!contentType) contentType = TYPE_JSON
            data = stringify(data)
          }
        }
      }
    }

    beforeEnd(res, contentType, code, data)
    res.end(data, cb)
  }

  return send
}
