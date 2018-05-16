const CodexToken = artifacts.require('./CodexToken.sol')
const CodexTitle = artifacts.require('./CodexTitle.sol')
const TokenProxy = artifacts.require('./TokenProxy.sol')

module.exports = (deployer, network) => {
  deployer.deploy(CodexTitle)
    .then(async (codexTitle) => {
      let erc20TokenAddress

      switch (network) {
        case 'ganache':
          {
            const codexToken = await CodexToken.deployed()
            erc20TokenAddress = codexToken.address
          }
          break

        default:
          throw new Error('No erc20TokenAddress defined for this network')
      }

      await codexTitle.setCodexTokenAddress(erc20TokenAddress)
    })
    .then(() => {
      return deployer.deploy(TokenProxy, CodexTitle.address)
    })
    .catch((error) => {
      console.log(error)
    })
}
