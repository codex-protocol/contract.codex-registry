require('dotenv').config();
require('babel-register');
require('babel-polyfill');

const HDWalletProvider = require('truffle-hdwallet-provider');

const infuraProvider = (network) => HDWalletProvider(
  process.env.MNEMONIC,
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
);

module.exports = {
  networks: {
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '*', // eslint-disable-line camelcase
      gasPrice: 0x01,
    },
    rinkeby: {
      provider: infuraProvider('rinkeby'),
      network_id: '4', // eslint-disable-line camelcase
      gasPrice: 5000000000, // 5 gwei
      gasLimit: 3000000,
    },
  },
};
