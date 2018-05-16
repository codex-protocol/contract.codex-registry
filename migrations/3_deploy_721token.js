const CodexToken = artifacts.require('./CodexToken.sol')
const CodexTitle = artifacts.require('./CodexTitle.sol')
const TokenProxy = artifacts.require('./TokenProxy.sol')

module.exports = (deployer, network, accounts) => {
  deployer.deploy(CodexTitle)
    .then(async (codexTitle) => {
      let erc20TokenAddress

      switch (network) {
        case 'develop':
        case 'ganache':
          {
            const codexToken = await CodexToken.deployed()
            erc20TokenAddress = codexToken.address
          }
          break

        default:
          throw new Error('No erc20TokenAddress defined for this network')
      }

      // Set the fees to 0 by default
      await codexTitle.setFees(erc20TokenAddress, accounts[0], 0)
    })
    .then(() => {
      return deployer.deploy(TokenProxy, CodexTitle.address)
    })
    .catch((error) => {
      console.log(error)
    })
}
