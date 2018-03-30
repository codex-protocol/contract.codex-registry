module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*', // Match any network id
      gasPrice: 1,
      gasLimit: 4612388
    },
    rinkeby: {
      host: 'localhost', // Connect to geth on the specified
      port: 8545,
      from: '0xE0d06a6C885C0994bf7f5C48F23cBB44da86E223', // default address to use for any transaction Truffle makes during migrations
      network_id: 4
    }
  }
}
