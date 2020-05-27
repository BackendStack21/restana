/**
 * destructing vs referencing
 */
const { report } = require('./util')
const Benchmark = require('benchmark')
const suite = new Benchmark.Suite()

const obj = {
  key1: true,
  key2: true
}

// add tests
suite
  .add('destructing', function () {
    const { key1, key2 } = obj
    return {
      key1,
      key2
    }
  })
  .add('referencing', function () {
    return {
      key1: obj.key1,
      key2: obj.key2
    }
  })
  .on('complete', function () {
    report(this)
  })
  .run({ async: false })
