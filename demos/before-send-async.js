'use strict'

const service = require('./../dist/index')({})

const beforeSendAsyncHook = (req, res, sendArgs) => {
  sendArgs[0] += 'from pre-send handler!'

  return Promise.resolve()
}

service.use((req, res, next) => {
  const send = res.send

  res.send = async function (...args) {
    try {
      await beforeSendAsyncHook(req, res, args)
      return send.apply(res, args)
    } catch (err) {
      return send.apply(res, err)
    }
  }

  return next()
})

service.get('/hi', (req, res) => {
  res.send('Hello World: ')
})
service.start()
