const CodexTitle = artifacts.require('./CodexTitle.sol')

module.exports = (deployer, network, accounts) => {
  deployer.deploy(CodexTitle)
}
