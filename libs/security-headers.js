'use strict'

const isForwardedHttps = (value) => {
  if (value === 'https' || value.startsWith('https,')) return true
  const comma = value.indexOf(',')
  const first = comma < 0 ? value : value.slice(0, comma)
  return first.trim().toLowerCase() === 'https'
}

const HSTS = 'max-age=15552000; includeSubDomains'

const setDefault = (res, name, value) => {
  if (res.getHeader(name) === undefined) res.setHeader(name, value)
}

/**
 * Creates a function that applies default security headers to the response,
 * if not already set. Headers can be overridden by the application via res.setHeader().
 *
 * @param {Object} options
 * @returns {(req: import('http').IncomingMessage, res: import('http').ServerResponse) => void}
 */
module.exports = (options) => {
  // Forwarded headers are only trustworthy when the application explicitly
  // opts in because clients can otherwise spoof them.
  const trustProxy = options.trustProxy === true

  return (req, res) => {
    setDefault(res, 'x-content-type-options', 'nosniff')
    setDefault(res, 'x-frame-options', 'DENY')
    setDefault(res, 'x-xss-protection', '0')

    if (req.socket?.encrypted || (trustProxy && isForwardedTLS(req))) {
      setDefault(res, 'strict-transport-security', HSTS)
    }
  }
}

function isForwardedTLS (req) {
  const forwardedProto = req.headers && req.headers['x-forwarded-proto']
  return typeof forwardedProto === 'string' && isForwardedHttps(forwardedProto)
}
