'use strict'

const restana = require('../index')

const ROUTES = 1000
const LOOKUPS = 10000

function buildService (routerCacheSize) {
  const service = restana({ prioRequestsProcessing: false, routerCacheSize })
  for (let index = 0; index < ROUTES; index++) {
    service.get(`/route/${index}`, () => {})
  }
  return service
}

function run (name, service, pathAt) {
  const router = service.getRouter()
  const response = {
    end () {},
    get finished () { return true }
  }
  const start = process.hrtime.bigint()

  for (let index = 0; index < LOOKUPS; index++) {
    router.lookup({
      method: 'GET',
      url: pathAt(index)
    }, response)
  }

  const elapsed = Number(process.hrtime.bigint() - start) / 1e6
  console.log(`${name}: ${LOOKUPS} lookups across ${ROUTES} routes in ${elapsed.toFixed(2)}ms`)
}

run('uncached', buildService(0), index => `/route/${index % ROUTES}`)
run('warm-cache', buildService(ROUTES), () => '/route/999')
