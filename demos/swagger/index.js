const path = require('path')
const service = require('./../../index')({})
const swagger = require('swagger-tools')
const spec = require('./swagger.json')

swagger.initializeMiddleware(spec, async (middleware) => {
  service.use(middleware.swaggerMetadata())
  service.use(middleware.swaggerValidator())
  service.use(middleware.swaggerUi())
  service.use(middleware.swaggerRouter({
    controllers: path.join(__dirname, '/controllers')
  }))

  await service.start(8000)
  console.log('API documentation is now running at http://localhost:8000/docs/')
})
