const CodexTitle = artifacts.require('./CodexTitle.sol')
const TokenProxy = artifacts.require('./TokenProxy.sol')

module.exports = (deployer) => {
  deployer.deploy(CodexTitle)
    .then(() => {
      return deployer.deploy(TokenProxy, CodexTitle.address)
    })
    .catch((error) => {
      console.log(error)
    })
}
