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

      let initialFees
      let erc20TokenAddress

      switch (network) {
        case 'ganache':
        case 'develop':
        case 'test':
        case 'coverage': {
          const codexToken = await CodexToken.deployed()
          erc20TokenAddress = codexToken.address
          initialFees = 0
          break
        }

        case 'rinkeby':
          erc20TokenAddress = '0xb05e292f89c6a82f5ed1be694dc7b6444866b364'
          initialFees = 10
          break

        default:
          throw new Error('No erc20TokenAddress & initialFees defined for this network')
      }

      console.log(`Setting the fees to ${initialFees} at ERC-20 token address: ${erc20TokenAddress}`)
      await proxiedCodexTitle.setFees(erc20TokenAddress, accounts[0], initialFees)

      return proxiedCodexTitle
    })
    .then(async (proxiedCodexTitle) => {

      let tokenURIPrefix

      switch (network) {
        case 'ganache':
        case 'develop':
        case 'test':
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
