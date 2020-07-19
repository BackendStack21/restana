/**
 * object delete
 */
const { report } = require('./util')
const Benchmark = require('benchmark')
const suite = new Benchmark.Suite()

const getObject = () => ({
  'content-length': 12,
  'content-type': 'application/json',
  referrer: 'https://nodejs.org',
  authorization: 'Bearer xxx'
})

function filterProps (obj, filter) {
  const keys = Object.keys(obj)
  const dest = {}

  let key
  let i
  for (i = 0; i < keys.length; i++) {
    key = keys[i].toLowerCase()
    if (key !== filter) {
      dest[key] = obj[key]
    }
  }
  return dest
}

// add tests
suite
  .add('filter', function () {
    const obj = getObject()

    filterProps(obj, 'content-length')
  })
  .add('delete', function () {
    const obj = getObject()

    delete obj['content-length']
  })
  .add('delete if present', function () {
    const obj = getObject()

    if (obj['content-length']) {
      delete obj['content-length']
    }
  })
  .on('complete', function () {
    report(this)
  })
  .run({ async: false })
