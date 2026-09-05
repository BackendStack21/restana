'use strict'

const restana = require('../index')

const ROUTES = 1000
const LOOKUPS = 10000
const SAMPLES = 5
const paths = Array.from({ length: ROUTES }, (_, index) => `/route/${index}`)

function buildService (routerCacheSize) {
  const service = restana({ prioRequestsProcessing: false, routerCacheSize })
  for (let index = 0; index < ROUTES; index++) {
    service.get(`/route/${index}`, () => {})
  }
  return service
}

function sample (service) {
  const router = service.getRouter()
  const response = {
    end () {},
    get finished () { return true }
  }
  const start = process.hrtime.bigint()

  for (let index = 0; index < LOOKUPS; index++) {
    router.lookup({
      method: 'GET',
      url: paths[index % ROUTES]
    }, response)
  }

  return Number(process.hrtime.bigint() - start) / 1e6
}

function run (name, routerCacheSize) {
  const service = buildService(routerCacheSize)

  // Warm the JIT and, for the cached case, every path under test.
  sample(service)
  const samples = Array.from({ length: SAMPLES }, () => sample(service)).sort((a, b) => a - b)
  const median = samples[Math.floor(samples.length / 2)]
  const operationsPerSecond = Math.round(LOOKUPS / (median / 1000))

  console.log(`${name}: median ${median.toFixed(2)}ms (${operationsPerSecond.toLocaleString()} lookups/sec)`)
}

run('uncached', 0)
run('warm-cache', ROUTES)
