/**
 * or chaining vs if
 */
const { report } = require('./util')
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
    report(this)
  })
  .run({ async: false })
