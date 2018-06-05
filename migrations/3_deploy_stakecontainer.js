const CodexCoin = artifacts.require('./CodexCoin.sol')
const CodexStakeContainer = artifacts.require('./CodexStakeContainer.sol')

module.exports = (deployer, network) => {
  deployer.then(async () => {
    let codexCoinAddress
    switch (network) {
      case 'ganache':
      case 'develop':
      case 'test':
      case 'coverage':
        codexCoinAddress = CodexCoin.address
        break

      case 'rinkeby': {
        codexCoinAddress = '0xb902c00f8e5aced53e2a513903fd831d32dd1097'
        break
      }

      default:
        throw new Error('No erc20TokenAddress & initialFees defined for this network')
    }

    // 90 days (in seconds)
    const lockInDuration = 7776000
    await deployer.deploy(CodexStakeContainer, codexCoinAddress, lockInDuration)
  })

}
