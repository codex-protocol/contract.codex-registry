const CodexToken = artifacts.require('./CodexToken.sol')
const ERC900StakeContainer = artifacts.require('./ERC900StakeContainer.sol')

module.exports = (deployer) => {
  deployer.deploy(ERC900StakeContainer, CodexToken.address)
}
