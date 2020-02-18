module.exports = (router) => {
  router.get('/sayHi/:name', (req, res) => {
    res.send({
      name: req.swagger.params.name.value,
      format: req.swagger.params.format.value
    })
  })

  return router
}
