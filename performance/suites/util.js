module.exports.report = benchmark => {
  console.log(benchmark.filter('successful').sort((a, b) => {
    a = a.stats; b = b.stats
    return (a.mean + a.moe > b.mean + b.moe ? 1 : -1)
  }).map(suite => {
    return {
      name: suite.name,
      mean: suite.stats.mean
    }
  }))
}
