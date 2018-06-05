export default (seconds) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [seconds],
      // id: 0,
    }, function (error, result) {
      if (error) reject(error)
      resolve(result)
    })
  })
}
