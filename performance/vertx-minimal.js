'use strict'

/* global vertx */
const Router = require('vertx-web-js/router')
const router = Router.router(vertx)

router.route('/hi').handler(function (routingContext) {
  routingContext.response().putHeader('content-type', 'text/html').end('Hello World!')
})

vertx.createHttpServer().requestHandler(router.handle).listen(3000)
