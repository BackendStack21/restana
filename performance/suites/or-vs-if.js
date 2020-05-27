/**
 * Benchmark to monitor performance regresions on the `res.send` method
 */
const Benchmark = require('benchmark')
const suite = new Benchmark.Suite()

let contentType
const headerExists = true
const value = 'text/plain'

// add tests
suite
  .add('or', function () {
    contentType = contentType || value
  })
  .add('or is set', function () {
    contentType = true || value
  })
  .add('if', function () {
    if (!contentType) contentType = value
  })
  .add('if exists', function () {
    if (!headerExists) contentType = value
  })
  .on('complete', function () {
    console.log(this.filter('successful').sort((a, b) => {
      a = a.stats; b = b.stats
      return (a.mean + a.moe > b.mean + b.moe ? 1 : -1)
    }).map(suite => {
      return {
        name: suite.name,
        mean: suite.stats.mean
      }
    }))
  })
  .run({ async: false })
