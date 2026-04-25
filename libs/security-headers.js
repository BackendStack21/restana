'use strict'

/**
 * Applies default security headers to the response, if not already set.
 * Headers can be overridden by the application via res.setHeader().
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
module.exports = (req, res) => {
  if (!res.getHeader('x-content-type-options')) {
    res.setHeader('x-content-type-options', 'nosniff')
  }
  if (!res.getHeader('x-frame-options')) {
    res.setHeader('x-frame-options', 'DENY')
  }
  if (!res.getHeader('x-xss-protection')) {
    res.setHeader('x-xss-protection', '0')
  }

  // HSTS on HTTPS connections
  const isTLS = req.socket && req.socket.encrypted
  const forwardedProto = req.headers && req.headers['x-forwarded-proto']
  if (isTLS || forwardedProto === 'https') {
    if (!res.getHeader('strict-transport-security')) {
      res.setHeader('strict-transport-security', 'max-age=15552000; includeSubDomains')
    }
  }
}
