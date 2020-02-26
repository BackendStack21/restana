'use strict'

const fastify = require('fastify')()

fastify.route({
  method: 'GET',
  url: '/:name/:age',
  schema: {
    params: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          msg: { type: 'string' },
          name: { type: 'boolean' },
          age: { type: 'number' },
          numbers: {
            type: 'array',
            items: {
              type: 'number'
            }
          }
        }
      }
    }
  },
  handler: async (request) => {
    const { name, age } = request.params
    return {
      msg: `Dear ${name}, you still can learn at your ${age}s ` +
        'that fastify is awesome ;)',
      name,
      age,
      numbers: [...Array(1000).keys()]
    }
  }
})

fastify.listen(3000)
