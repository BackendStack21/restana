'use strict'

/**
 * Applies default security headers to the response, if not already set.
 * Headers can be overridden by the application via res.setHeader().
 *
 * @param {Object} options
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
module.exports = (options, req, res) => {
  if (!res.getHeader('x-content-type-options')) {
    res.setHeader('x-content-type-options', 'nosniff')
  }
  if (!res.getHeader('x-frame-options')) {
    res.setHeader('x-frame-options', 'DENY')
  }
  if (!res.getHeader('x-xss-protection')) {
    res.setHeader('x-xss-protection', '0')
  }

  // Forwarded headers are only trustworthy when the application explicitly
  // opts in because clients can otherwise spoof them.
  const isTLS = req.socket && req.socket.encrypted
  const trustProxy = options.trustProxy === true
  const forwardedProto = trustProxy && req.headers && req.headers['x-forwarded-proto']
  const isForwardedTLS = typeof forwardedProto === 'string' &&
    forwardedProto.split(',', 1)[0].trim().toLowerCase() === 'https'

  if (isTLS || isForwardedTLS) {
    if (!res.getHeader('strict-transport-security')) {
      res.setHeader('strict-transport-security', 'max-age=15552000; includeSubDomains')
    }
  }
}
