'use strict'

const Muneem = require('muneem')
const service = Muneem()

service.get('/hi', (asked, answer) => {
  answer.write('Hello World!')
})
service.start(3000)
