require('babel-register')
require('babel-polyfill')

const dotenv = require('dotenv')
const HDWalletProvider = require('truffle-hdwallet-provider')

dotenv.config()

const infuraProvider = (network) => {
  return new HDWalletProvider(
    process.env.MNEMONIC,
    `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
  )
}

module.exports = {
  networks: {
    coverage: {
      host: 'localhost',
      port: 8555,
      network_id: '*', // eslint-disable-line camelcase
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    test: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
      gasPrice: 0x01,
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '*', // eslint-disable-line camelcase
      gasPrice: 0x01,
    },
    ropsten: {
      provider: infuraProvider('ropsten'),
      network_id: '3', // eslint-disable-line camelcase
      gas: 4612388,
      gasPrice: 10000000000, // 10 gwei
    },
    rinkeby: {
      provider: infuraProvider('rinkeby'),
      network_id: '4', // eslint-disable-line camelcase
      gasPrice: 5000000000, // 5 gwei
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
}
