const CodexCoin = artifacts.require('./CodexCoin.sol')
const CodexStakeContract = artifacts.require('./CodexStakeContract.sol')

module.exports = (deployer, network) => {
  deployer.then(async () => {
    let codexCoinAddress

    // 90 days (in seconds)
    const defaultLockInDuration = 7776000

    switch (network) {
      case 'ganache':
      case 'develop':
      case 'test':
      case 'coverage':
        codexCoinAddress = CodexCoin.address
        break

      case 'ropsten':
        codexCoinAddress = '0x2af5409438d2e6c241015f3130213f6a122b4064'
        break

      case 'rinkeby':
        codexCoinAddress = '0x6a8c5db1495ffc4ef183dfccfdc4de5164b4e95c'
        break

      default:
        throw new Error('No codexCoinAddress defined for this network')
    }

    await deployer.deploy(
      CodexStakeContract,
      codexCoinAddress,
      defaultLockInDuration,
    )
  })

}
