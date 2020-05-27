/**
 * Benchmark to monitor performance regresions on the `res.send` method
 */
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
  .on('complete', function () {
    console.log(this.filter('successful').sort((a, b) => {
      a = a.stats; b = b.stats
      return (a.mean + a.moe > b.mean + b.moe ? 1 : -1)
    }).map(suite => {
      return {
        name: suite.name,
        mean: suite.stats.mean.toFixed(10)
      }
    }))
  })
  .run({ async: false })
