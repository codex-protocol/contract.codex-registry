const CodexCoin = artifacts.require('./CodexCoin.sol')

module.exports = (deployer, network, accounts) => {

  // Only deploy the ERC20 token for local testing.
  // In staging/production environments the token will get deployed separately
  //  and its address will manually get added to the deployment script.
  switch (network) {
    case 'ganache':
    case 'develop':
    case 'test':
    case 'coverage':
      // For local testing, we use accounts[2] as the registry API (i.e., the faucet)
      deployer.deploy(CodexCoin, { from: accounts[2] })
      break

    default:
      break
  }
}
