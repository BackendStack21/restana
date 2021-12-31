const swaggerValidation = require('openapi-validator-middleware')
const express = require('express')
const path = require('path')

swaggerValidation.init(path.join(__dirname, 'swagger.json'))

const app = express()
app.get('/api/sayHi/:name', swaggerValidation.validate, (req, res, next) => {
  res.send({
    name: req.params.name,
    format: req.query.format
  })
})

app.listen(3000)
