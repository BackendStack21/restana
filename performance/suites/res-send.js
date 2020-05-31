/**
 * Benchmark to monitor performance regresions on the `res.send` method
 */
const { report } = require('./util')
const Benchmark = require('benchmark')
const suite = new Benchmark.Suite()

const extensions = require('../../libs/response-extensions')
const send = extensions.send({}, {}, {
  statusCode: 200,
  end () {},
  setHeader () {},
  getHeader () {}
})

const buffer = Buffer.from('Hello World!')
const json = { msg: 'Hello World' }
const stream = {
  pipe () {},
  on () {}
}
const promise = Promise.resolve(buffer)
const headers = {
  'content-type': 'text/plain',
  'x-framework': 'restana',
  'x-author': '@kyberneees'
}
const err = new Error('Upps!')
err.code = 400

// add tests
suite
  .add('error', function () {
    send(err)
  })
  .add('string', function () {
    send('Hello World')
  })
  .add('string + headers', function () {
    send('Hello World', 200, headers)
  })
  .add('json', function () {
    send(json)
  })
  .add('json + headers', function () {
    send(json, 200, headers)
  })
  .add('null', function () {
    send(null)
  })
  .add('undefined', function () {
    send()
  })
  .add('statusCode', function () {
    send(200)
  })
  .add('buffer', function () {
    send(buffer)
  })
  .add('stream', function () {
    send(stream)
  })
  .add('promise', function () {
    send(promise)
  })
  .add('promise + headers', function () {
    send(promise, 200, headers)
  })
  .on('complete', function () {
    report(this)
  })
  .run({ async: false })
