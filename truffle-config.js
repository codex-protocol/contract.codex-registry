module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*' // Match any network id
    },
    rinkeby: {
      host: 'localhost', // Connect to geth on the specified
      port: 8545,
      from: '0x582b0AAfA1471971760779e734145CE9D3d01C32', // default address to use for any transaction Truffle makes during migrations
      network_id: 4,
      gas: 9612388 // Gas limit used for deploys
    }
  }
}
