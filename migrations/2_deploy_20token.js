const CodexToken = artifacts.require('./CodexToken.sol')

module.exports = (deployer, network) => {

  // Only deploy the ERC20 token for local testing.
  // In staging/production environments the token will get deployed separately
  //  and its address will manually get added to the deployment script.
  switch (network) {
    case 'ganache':
    case 'develop':
    case 'test':
    case 'coverage':
      deployer.deploy(CodexToken)
      break

    default:
      break
  }
}
