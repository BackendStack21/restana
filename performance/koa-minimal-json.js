'use strict'

const Koa = require('koa')
const service = new Koa()
const router = require('koa-router')()

router.get('/hi', async (ctx) => {
  ctx.body = {
    msg: 'Hello World!'
  }
  ctx.status = 200
})

service.use(router.routes())

service.listen(3000)
