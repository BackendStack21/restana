const uWS = require('uWebSockets.js')
const EventEmitter = require('events')

module.exports = (opts = {}) => {
  let server
  if (opts.cert_file_name) {
    server = uWS.SSLApp(opts)
  } else {
    server = uWS.App({})
  }

  return new HttpServer(server)
}

class HttpRequest extends EventEmitter {
  constructor (req) {
    super()
    this.req = req

    this.url = req.getUrl()
    this.method = String(req.getMethod()).toUpperCase()
    this.headers = {}
  }
}

class HttpResponse extends EventEmitter {
  constructor (res) {
    super()
    this.res = res
  }

  setHeader (header, value) {
    return this.writeHeader(header, value)
  }

  writeStatus (status) {
    return this.res.writeStatus(status)
  }

  writeHeader (header, value) {
    return this.res.writeHeader(header, value)
  }

  end (data, cb) {
    this.res.end(data)
    cb()
  }

  write (data) {
    return this.res.write(data)
  }

  getWriteOffset () {
    return this.res.getWriteOffset()
  }

  onData (handler) {
    return this.res.onData(handler)
  }

  hasResponded () {
    return this.res.hasResponded()
  }

  onAborted (handler) {
    return this.res.onAborted(handler)
  }

  onWritable (handler) {
    return this.res.onWritable(handler)
  }
}

class HttpServer extends EventEmitter {
  constructor (server) {
    super()
    this.uws = server

    server.any('*', (res, req) => {
      this.emit('request', new HttpRequest(req), new HttpResponse(res))

      // uWebSockets requirement for async processing
      res.onAborted(() => {})
    })
  }

  close () {
    return this.uws.close()
  }

  listen (port) {
    return new Promise((resolve, reject) => {
      this.uws.listen(port, (socket) => {
        if (socket) {
          resolve(socket)
        } else {
          reject(new Error('Failed to listen to port ' + port))
        }
      })
    })
  }
}
