module.exports.sayHi = (req, res) => {
  res.send({
    name: req.swagger.params.name.value
  })
}
