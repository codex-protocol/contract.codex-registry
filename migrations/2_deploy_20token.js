const CodexToken = artifacts.require('./CodexToken.sol')

module.exports = async (deployer, network) => {

  // Only deploy the ERC20 token for local testing.
  // In staging/production environments the token will get deployed separately
  //  and its address will manually get added to the deployment script.
  if (network === 'ganache' || network === 'develop') {
    deployer.deploy(CodexToken)
  }
}
