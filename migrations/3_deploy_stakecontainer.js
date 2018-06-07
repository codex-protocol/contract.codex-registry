const CodexCoin = artifacts.require('./CodexCoin.sol')
const CodexStakeContainer = artifacts.require('./CodexStakeContainer.sol')

module.exports = (deployer, network) => {
  deployer.then(async () => {
    let codexCoinAddress
    let lockInDuration
    let annualizedInterestRate

    switch (network) {
      case 'ganache':
      case 'develop':
      case 'test':
      case 'coverage':
        codexCoinAddress = CodexCoin.address

        // 90 days (in seconds)
        lockInDuration = 7776000

        // 10% annually
        annualizedInterestRate = web3.toWei(0.1, 'ether')
        break

      case 'rinkeby': {
        codexCoinAddress = '0xb902c00f8e5aced53e2a513903fd831d32dd1097'
        break
      }

      default:
        throw new Error('No erc20TokenAddress & initialFees defined for this network')
    }

    await deployer.deploy(
      CodexStakeContainer,
      codexCoinAddress,
      lockInDuration,
      annualizedInterestRate,
    )
  })

}
