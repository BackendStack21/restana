'use strict'

const restana = require('../index')
const responseExtensions = require('../libs/response-extensions')

function budget (name, maximumMilliseconds, operation) {
  const start = process.hrtime.bigint()
  operation()
  const elapsed = Number(process.hrtime.bigint() - start) / 1e6
  console.log(`${name}: ${elapsed.toFixed(2)}ms (budget ${maximumMilliseconds}ms)`)

  if (elapsed > maximumMilliseconds) {
    throw new Error(`${name} exceeded its performance budget`)
  }
}

budget('mixed response serialization (100k)', 1000, () => {
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

budget('cached routing (50k across 500 routes)', 1500, () => {
  const service = restana({ routerCacheSize: 500 })
  const router = service.getRouter()
  const paths = Array.from({ length: 500 }, (_, index) => `/route/${index}`)
  const response = {
    end () {},
    get finished () { return true }
  }

  for (const path of paths) {
    service.get(path, () => {})
    router.lookup({ method: 'GET', url: path }, response)
  }

  for (let index = 0; index < 50000; index++) {
    router.lookup({ method: 'GET', url: paths[index % paths.length] }, response)
  }
})
