'use strict'

const restana = require('../index')
const responseExtensions = require('../libs/response-extensions')
const sequential = require('0http/lib/router/sequential')

function budget (name, maximumMilliseconds, operation) {
  const start = process.hrtime.bigint()
  operation()
  const elapsed = Number(process.hrtime.bigint() - start) / 1e6
  console.log(`${name}: ${elapsed.toFixed(2)}ms (budget ${maximumMilliseconds}ms)`)

  if (elapsed > maximumMilliseconds) {
    throw new Error(`${name} exceeded its performance budget`)
  }
}

budget('mixed response serialization (100k)', 250, () => {
  const response = {
    statusCode: 200,
    end () {},
    setHeader () {},
    getHeader () {}
  }
  const send = responseExtensions.send({}, {}, response)

  for (let index = 0; index < 100000; index++) {
    if (index % 3 === 0) send('hello')
    else if (index % 3 === 1) send({ ok: true })
    else send('hello', 200, { vary: ['accept', 'origin'] })
  }
})

const routes = 500
const lookups = 50000
const paths = Array.from({ length: routes }, (_, index) => `/route/${index}`)
const response = {
  end () {},
  get finished () { return true }
}

function buildRouter (router) {
  for (const path of paths) router.get(path, () => {})
  for (const path of paths) router.lookup({ method: 'GET', url: path }, response)
  return router
}

function lookupBatch (router) {
  for (let index = 0; index < lookups; index++) {
    router.lookup({ method: 'GET', url: paths[index % paths.length] }, response)
  }
}

function median (operation) {
  const samples = []
  operation()
  for (let sample = 0; sample < 5; sample++) {
    const start = process.hrtime.bigint()
    operation()
    samples.push(Number(process.hrtime.bigint() - start) / 1e6)
  }
  return samples.sort((a, b) => a - b)[2]
}

const service = restana({ routerCacheSize: routes })
const frameworkRouter = buildRouter(service.getRouter())
const dependencyRouter = buildRouter(sequential({ cacheSize: routes }))

budget('cached routing (50k across 500 routes)', 500, () => {
  lookupBatch(frameworkRouter)
})

const dependencyMedian = median(() => lookupBatch(dependencyRouter))
const frameworkMedian = median(() => lookupBatch(frameworkRouter))
const allowedOverhead = dependencyMedian * 1.25

console.log(`router integration: ${frameworkMedian.toFixed(2)}ms vs dependency ${dependencyMedian.toFixed(2)}ms`)
if (frameworkMedian > allowedOverhead) {
  throw new Error(`router integration exceeded 25% overhead (${allowedOverhead.toFixed(2)}ms budget)`)
}
