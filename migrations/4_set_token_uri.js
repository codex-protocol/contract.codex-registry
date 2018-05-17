const CodexTitle = artifacts.require('./CodexTitle.sol')
const CodexTitleProxy = artifacts.require('./CodexTitleProxy.sol')

module.exports = async (deployer, network) => {

  deployer
    .then(async () => {

      let tokenURIPrefix

      switch (network) {
        case 'develop':
        case 'ganache':
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

      const codexTitleProxy = await CodexTitleProxy.deployed()
      const codexTitle = CodexTitle.at(codexTitleProxy.address)

      console.log('Setting the tokenURIPrefix to:', tokenURIPrefix)

      codexTitle.setTokenURIPrefix(tokenURIPrefix)
    })
    .catch((error) => {
      console.log(error)
    })
}
