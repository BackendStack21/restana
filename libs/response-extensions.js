'use strict'

const { forEachObject, toHttpStatusCode } = require('./utils')

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
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'set-cookie',
  'set-cookie2',
  'te',
  'trailer',
  'upgrade'
])

const stringify = obj => {
  return JSON.stringify(obj)
}

const STATUS_TEXTS = require('http').STATUS_CODES

const beforeEnd = (res, contentType, statusCode, data) => {
  if (contentType) {
    res.setHeader(CONTENT_TYPE_HEADER, contentType)
  }
  res.statusCode = toHttpStatusCode(statusCode, res.statusCode)
}

const isProduction = () => process.env.NODE_ENV === 'production'

const parseErr = (options, error) => {
  const statusCode = toHttpStatusCode(error.status || error.code || error.statusCode)

  if (!options.debugErrors || isProduction()) {
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
      const err = parseErr(options, data)
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

      if (data !== undefined && data !== null) {
        if (typeof data === 'string') {
          if (!contentType) contentType = TYPE_PLAIN
        } else if (typeof data === 'boolean') {
          if (!contentType) contentType = TYPE_JSON
          data = stringify(data)
        } else if (typeof data === 'object') {
          if (Buffer.isBuffer(data)) {
            if (!contentType) contentType = TYPE_OCTET
          } else if (typeof data.pipe === 'function') {
            if (!contentType) contentType = TYPE_OCTET

            // NOTE: we exceptionally handle the response termination for streams
            beforeEnd(res, contentType, code, data)

            let callbackCalled = false
            const complete = (err) => {
              if (callbackCalled) return
              callbackCalled = true
              cb(err)
            }

            data.once('error', (err) => {
              data.unpipe(res)
              if (!res.headersSent && !res.destroyed) {
                res.removeHeader(CONTENT_TYPE_HEADER)
                try {
                  const result = options.errorHandler(err, req, res)
                  if (result && typeof result.then === 'function') {
                    result.catch(handlerError => res.destroy(handlerError))
                  }
                } catch (handlerError) {
                  res.destroy(handlerError)
                }
              } else {
                res.destroy(err)
              }
              complete(err)
            })
            res.once('finish', complete)
            res.once('close', complete)
            data.pipe(res)

            return
          } else if (typeof data.then === 'function') {
            if (_promiseDepth >= MAX_PROMISE_DEPTH) {
              data = stringify({ code: 500, message: 'Internal Server Error' })
              contentType = TYPE_JSON
              code = 500
            } else {
              headers = null
              return Promise.resolve(data)
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
