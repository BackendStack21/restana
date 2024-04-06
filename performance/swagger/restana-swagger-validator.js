const restana = require('../../dist/index')
const path = require('path')

const {
  SwaggerValidationError,
  SwaggerValidator
} = require('restana-swagger-validator')

const app = restana({
  errorHandler: (err, req, res) => {
    if (err instanceof SwaggerValidationError) {
      res.statusCode = err.statusCode
      res.send({
        message: err.message,
        errors: err.errors
      })
    } else {
      res.send(err)
    }
  }
})

SwaggerValidator(app, path.join(__dirname, '/swagger.json'), {
  buildResponses: false,
  publicApiEndpoint: 'http://localhost:3000'
})

app.get('/api/sayHi/:name', (req, res) => {
  res.send({
    name: req.params.name,
    format: req.query.format
  })
})

app.start()
