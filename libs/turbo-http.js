/**
 * turbo-http module integration
 *
 * @see https://github.com/mafintosh/turbo-http
 */
const util = require('util')
const EventEmitter = require('events')
const turbo = require('turbo-http')

/**
 * extending turbo-http Response class from EventEmitter
 */
const Response = require('turbo-http/lib/response')
util.inherits(Response, EventEmitter)

/**
 * creating turbo-http server instance
 */
const server = module.exports = turbo.createServer()

/**
 * ensure restana 'req' object compatibility
 */
server.on('request', (req, res) => {
  setImmediate(() => {
    if (!req.headers) {
      // populating req.headers if missing
      const headers = req.getAllHeaders()
      if (headers instanceof Map) {
        req.headers = {}
        headers.forEach((v, k) => (req.headers[k] = v))
      } else {
        req.headers = headers
      }
    }
  })
})
