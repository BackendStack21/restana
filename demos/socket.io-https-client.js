'use strict'

const socket = require('socket.io-client')('https://localhost:3000', {
  transports: ['websocket'], rejectUnauthorized: false
})
socket.on('connect', function () {
  console.log('connected')
})
socket.on('disconnect', function (reason) {
  console.log('disconnected', reason)
})
