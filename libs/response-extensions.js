'use strict'

const { forEach } = require('./utils')

const CONTENT_TYPE_HEADER = 'content-type'
const CONTENT_TYPE = {
  JSON: 'application/json; charset=utf-8',
  PLAIN: 'text/plain; charset=utf-8',
  OCTET: 'application/octet-stream'
}
const NOOP = () => {}

const setHeader = (res, value) => {
  if (!res.hasHeader(CONTENT_TYPE_HEADER)) {
    res.setHeader(CONTENT_TYPE_HEADER, value)
  }
}

const stringify = (obj) => {
  // ToDo: fast json stringify
  return JSON.stringify(obj)
}

const sendJSON = (res, obj, cb) => {
  res.end(stringify(obj), cb)
}

const sendError = (res, error, cb) => {
  const errorCode = error.status || error.code || error.statusCode
  res.statusCode = typeof errorCode === 'number' ? parseInt(errorCode) : 500
  res.setHeader(CONTENT_TYPE_HEADER, CONTENT_TYPE.JSON)

  return sendJSON(res, {
    code: res.statusCode,
    message: error.message,
    data: error.data
  }, cb)
}

/**
 * The friendly 'res.send' method
 * No comments needed ;)
 */
module.exports.send = (options, req, res) => {
  return (data = 200, code = 200, headers = null, cb = NOOP) => {
    if (headers !== null) {
      forEach(headers, (value, key) => {
        res.setHeader(key.toLowerCase(), value)
      })
    }

    if (data instanceof Error) {
      sendError(res, data, cb)
      return
    }

    if (typeof data === 'number') {
      code = parseInt(data, 10)
      data = res.body
    }

    res.statusCode = code

    if (data != null) {
      if (typeof data === 'string') {
        setHeader(res, CONTENT_TYPE.PLAIN)
      } else if (data instanceof Buffer) {
        setHeader(res, CONTENT_TYPE.OCTET)
      } else if (typeof data.pipe === 'function') {
        setHeader(res, CONTENT_TYPE.OCTET)
        data.pipe(res)
        data.on('end', cb)
        return
      } else if (typeof data === 'object') {
        setHeader(res, CONTENT_TYPE.JSON)
        sendJSON(res, data, cb)
        return
      }
    }

    // finally end request
    res.end(data, cb)
  }
}
