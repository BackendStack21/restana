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

const string = 'Hello World!'

// add tests
suite
  .add('string', function () {
    return send(string)
  })
  .on('complete', function () {
    report(this)
  })
  .run({ async: false })
