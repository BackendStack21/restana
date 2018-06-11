const service = require('express')({})

service.get('/:name/:age', (req, res) => {
  const {name, age} = req.params
  res.send({
    msg: `Dear ${name}, you still can learn at your ${age}s ` +
      `that express is !awesome ;)`,
    name,
    age,
    numbers: [...Array(1000).keys()]
  })
})

service.listen(3000)
