const CodexToken = artifacts.require('./CodexToken.sol')
const ERC900BasicStakeContainer = artifacts.require('./ERC900BasicStakeContainer.sol')

module.exports = (deployer) => {
  deployer.deploy(ERC900BasicStakeContainer, CodexToken.address)
}
