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

const promise = Promise.resolve('Hello World!')
const headers = {
  'content-type': 'text/plain',
  'x-framework': 'restana',
  'x-author': '@kyberneees'
}

// add tests
suite
  .add('promise', {
    defer: true,
    fn (deferred) {
      send(promise).then(() => deferred.resolve())
    }
  })
  .add('promise + headers', {
    defer: true,
    fn (deferred) {
      send(promise, 200, headers).then(() => deferred.resolve())
    }
  })
  .on('complete', function () {
    report(this)
  })
  .run({ async: true })
