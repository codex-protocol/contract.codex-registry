const CodexCoin = artifacts.require('./CodexCoin.sol')
const CodexStakeContainer = artifacts.require('./CodexStakeContainer.sol')

module.exports = (deployer, network) => {
  deployer.then(async () => {
    let codexCoinAddress

    // 90 days (in seconds)
    const lockInDuration = 7776000

    // 10% annually
    const annualizedInterestRate = web3.toWei(0.1, 'ether')

    switch (network) {
      case 'ganache':
      case 'develop':
      case 'test':
      case 'coverage':
        codexCoinAddress = CodexCoin.address
        break

      case 'ropsten':
        codexCoinAddress = '0x2226895704448e5f579654d1d95e853e24a4c929'
        break

      case 'rinkeby':
        codexCoinAddress = '0xb7f7848507a6af9c6d7560da89d4778aa1043d69'
        break

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
