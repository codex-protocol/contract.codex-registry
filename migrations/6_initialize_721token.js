const CodexCoin = artifacts.require('./CodexCoin.sol')
const CodexRecord = artifacts.require('./CodexRecord.sol')
const CodexRecordProxy = artifacts.require('./CodexRecordProxy.sol')
const CodexStakeContract = artifacts.require('./CodexStakeContract.sol')

module.exports = async (deployer, network, accounts) => {
  const proxiedCodexRecord = CodexRecord.at(CodexRecordProxy.address)

  deployer
    .then(async () => {
      let initialFees
      let erc20TokenAddress

      switch (network) {
        case 'test':
        case 'ganache':
        case 'develop':
        case 'coverage':
          initialFees = web3.toWei(1, 'ether')
          erc20TokenAddress = CodexCoin.address
          break

        case 'ropsten':
          initialFees = 0
          erc20TokenAddress = '0x2226895704448e5f579654d1d95e853e24a4c929'
          break

        case 'rinkeby':
          initialFees = 0
          erc20TokenAddress = '0xb7f7848507a6af9c6d7560da89d4778aa1043d69'
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

      await proxiedCodexRecord.setStakeContract(
        CodexStakeContract.address
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

        case 'ropsten':
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
