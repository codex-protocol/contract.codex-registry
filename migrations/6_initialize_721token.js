const CodexCoin = artifacts.require('./CodexCoin.sol')
const CodexRecord = artifacts.require('./CodexRecord.sol')
const CodexRecordProxy = artifacts.require('./CodexRecordProxy.sol')
const CodexStakeContainer = artifacts.require('./CodexStakeContainer.sol')

module.exports = async (deployer, network, accounts) => {
  const proxiedCodexRecord = CodexRecord.at(CodexRecordProxy.address)

  deployer
    .then(async () => {
      let initialFees
      let erc20TokenAddress

      switch (network) {
        case 'ganache':
        case 'develop':
        case 'test':
        case 'coverage': {
          erc20TokenAddress = CodexCoin.address
          initialFees = 0
          break
        }

        case 'rinkeby':
          erc20TokenAddress = '0xb902c00f8e5aced53e2a513903fd831d32dd1097'
          initialFees = web3.toWei(1, 'ether')
          break

        default:
          throw new Error('No erc20TokenAddress & initialFees defined for this network')
      }

      console.log(`Setting the fees to ${initialFees} at ERC-20 token address: ${erc20TokenAddress}`)
      await proxiedCodexRecord.setFees(
        erc20TokenAddress,
        accounts[0],
        initialFees, // creationFee
        initialFees, // transferFee
        initialFees, // modificationFee
      )

      await proxiedCodexRecord.setStakeContainer(
        CodexStakeContainer.address
      )
    })
    .then(async () => {

      let tokenURIPrefix

      switch (network) {
        case 'ganache':
        case 'develop':
        case 'test':
        case 'coverage':
          tokenURIPrefix = 'http://localhost:3001/token-metadata'
          break

        case 'rinkeby':
          tokenURIPrefix = 'http://codex-registry-api.codexprotocol-staging.com/token-metadata'
          break

        case 'mainnet':
          tokenURIPrefix = 'http://codex-registry-api.codexprotocol.com/token-metadata'
          break

        default:
          throw new Error('No tokenURIPrefix defined for this network')
      }

      console.log('Setting the tokenURIPrefix to:', tokenURIPrefix)
      await proxiedCodexRecord.setTokenURIPrefix(tokenURIPrefix)
    })
    .catch((error) => {
      console.log(error)

      throw error
    })
}
