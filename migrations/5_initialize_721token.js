const CodexToken = artifacts.require('./CodexToken.sol')
const CodexTitle = artifacts.require('./CodexTitle.sol')
const CodexTitleProxy = artifacts.require('./CodexTitleProxy.sol')

module.exports = async (deployer, network, accounts) => {

  deployer
    .then(async () => {
      const codexTitleProxy = await CodexTitleProxy.deployed()
      const proxiedCodexTitle = CodexTitle.at(codexTitleProxy.address)

      return proxiedCodexTitle
    })
    .then(async (proxiedCodexTitle) => {
      let erc20TokenAddress

      switch (network) {
        case 'develop':
        case 'ganache':
        case 'coverage': {
          const codexToken = await CodexToken.deployed()
          erc20TokenAddress = codexToken.address
          break
        }

        case 'rinkeby':
          erc20TokenAddress = '0xb05e292f89c6a82f5ed1be694dc7b6444866b364'
          break

        default:
          throw new Error('No erc20TokenAddress defined for this network')
      }

      console.log('Setting the fees to 0 at ERC-20 token address:', erc20TokenAddress)
      await proxiedCodexTitle.setFees(erc20TokenAddress, accounts[0], 0)

      return proxiedCodexTitle
    })
    .then(async (proxiedCodexTitle) => {

      let tokenURIPrefix

      switch (network) {
        case 'develop':
        case 'ganache':
        case 'coverage':
          tokenURIPrefix = 'http://localhost:3001/token-metadata'
          break

        case 'rinkeby':
          tokenURIPrefix = 'http://codex-title-api.codexprotocol-staging.com/token-metadata'
          break

        case 'mainnet':
          tokenURIPrefix = 'http://codex-title-api.codexprotocol.com/token-metadata'
          break

        default:
          throw new Error('No tokenURIPrefix defined for this network')
      }

      console.log('Setting the tokenURIPrefix to:', tokenURIPrefix)
      await proxiedCodexTitle.setTokenURIPrefix(tokenURIPrefix)
    })
    .catch((error) => {
      console.log(error)
    })
}
