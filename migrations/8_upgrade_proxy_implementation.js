const CodexCoin = artifacts.require('./CodexCoin.sol')
const CodexRecordV2 = artifacts.require('./CodexRecordV2.sol')
const CodexRecordProxy = artifacts.require('./CodexRecordProxy.sol')
// const CodexStakeContract = artifacts.require('./CodexStakeContract.sol')

module.exports = (deployer, network, accounts) => {

  let owner = null
  let feeOperators = null
  let tokenURIPrefix = null
  let codexRecordProxyAddress = null

  /* eslint-disable prefer-const */
  let skipSetup = true
  let creationFee = null
  let transferFee = null
  let feeRecipient = null
  let modificationFee = null
  let codexCoinAddress = null
  let codexStakeContractAddress = null
  /* eslint-enable prefer-const */

  switch (network) {
    case 'test':
    case 'ganache':
    case 'develop':
    case 'coverage':

      skipSetup = false

      owner = accounts[1]
      tokenURIPrefix = 'http://localhost:3001/token-metadata/'
      codexRecordProxyAddress = CodexRecordProxy.address

      feeOperators = [
        owner,
        accounts[2],
        accounts[3],
      ]

      creationFee = web3.toWei(150, 'ether')
      transferFee = web3.toWei(0, 'ether')
      modificationFee = web3.toWei(30, 'ether')
      feeRecipient = accounts[9]
      codexCoinAddress = CodexCoin.address
      // codexStakeContractAddress = CodexStakeContract.address

      break

    case 'ropsten':

      owner = '0xA7899114e93880A5790a68F9df66174FC038849a' // accounts[0] on Testnet Ledger
      tokenURIPrefix = `http://${network}-api.codexprotocol.com/token-metadata/`
      codexRecordProxyAddress = '0x714cd5d6425ef198768d504edf190b5aa5b44334'

      feeOperators = [
        owner,
        '0x60f8f4ba00fc1bdcb482b3f8d8929492c00e81f3', // ???
        '0x218074BA02072731b163e04F7C36000b566eaEF9', // accounts[0] with "testnet identity v2 / bulk signer mnemonic"
      ]

      // creationFee = web3.toWei(150, 'ether')
      // transferFee = web3.toWei(0, 'ether')
      // modificationFee = web3.toWei(30, 'ether')
      // feeRecipient = '0xE37465ab15fd77EeEa1db4a11c175f898eAbA396' // accounts[1] on Testnet Ledger
      // codexCoinAddress = '0xc50efb6572218614d743c9929bd93b0a1a3982a9'
      // codexStakeContractAddress = '0x0bb7d24b10768431b5b7bda9afde822ca2ff3ad6'

      break

    case 'rinkeby':

      owner = '0xA7899114e93880A5790a68F9df66174FC038849a' // accounts[0] on Testnet Ledger
      tokenURIPrefix = `https://${network}-api.codexprotocol.com/token-metadata/`
      codexRecordProxyAddress = '0xa3fb132c4622db86bbf39cf5e6301d8a2a1145a8'

      feeOperators = [
        owner,
        '0x60f8f4ba00fc1bdcb482b3f8d8929492c00e81f3', // ???
        '0x218074BA02072731b163e04F7C36000b566eaEF9', // accounts[0] with "testnet identity v2 / bulk signer mnemonic"
      ]

      // creationFee = web3.toWei(150, 'ether')
      // transferFee = web3.toWei(0, 'ether')
      // modificationFee = web3.toWei(30, 'ether')
      // feeRecipient = '0xE37465ab15fd77EeEa1db4a11c175f898eAbA396' // accounts[1] on Testnet Ledger
      // codexCoinAddress = '0xe33345607c3065578f11ea456834ff9e82739d56'
      // codexStakeContractAddress = '0x2bbcae1335a97e440c7d9f3f638db26abfad3207'

      break

    case 'mainnet':

      owner = '0x20f3d6bd4da1dafa00fbc562081c005878e1a74b' // accounts[2] on Mainnet Ledger
      tokenURIPrefix = 'https://api.codexprotocol.com/token-metadata/'
      codexRecordProxyAddress = '0x8853b05833029e3cf8d3cbb592f9784fa43d2a79'

      feeOperators = [
        owner,
        '0xe7ebbec0a89efd478dd72dc769be475a9f1ce50a', // ???
        '0x4e57529d3630B4aD415BDedda508e40e4C632bAF', // accounts[0] with "mainnet identity v2 / bulk signer mnemonic"
      ]

      // creationFee = web3.toWei(150, 'ether')
      // transferFee = web3.toWei(0, 'ether')
      // modificationFee = web3.toWei(30, 'ether')
      // feeRecipient = '0xBe25eE3619472545418Acb609B0CE6cA6F69bdfB' // accounts[9] on Mainnet Ledger
      // codexCoinAddress = '0xf226e38c3007b3d974fc79bcf5a77750035436ee'
      // codexStakeContractAddress = '0xdea454c9c4ad408f324cc0ea382b2b7aad99640c'

      break

    default:
      throw new Error('No migration defined for this network')
  }

  // Deploy CodexRecordV2
  return deployer.deploy(CodexRecordV2)
    .then((codexRecordV2) => {

      // update owner of CodexRecordV2 (note that we do not need to do this for
      //  the proxy contact as that's already been done)
      console.log(`Setting owner of CodexRecordV2 contract to ${owner}...`)
      return codexRecordV2.initializeOwnable(owner)

        // upgrade the proxy implementation
        .then(() => {

          if (skipSetup) return null

          const codexRecordProxy = CodexRecordProxy.at(codexRecordProxyAddress)
          return Promise.all([
            codexRecordProxy.version(),
            codexRecordProxy.implementation(),
          ])
            .then(([proxyImplementationVersion, proxyImplementationAddress]) => {
              const newProxyImplementationVersion = (Number.parseInt(proxyImplementationVersion, 10) + 1).toString()
              console.log(`Upgrading CodexRecordProxy (${codexRecordProxyAddress}) implementation from version ${proxyImplementationVersion} (at address ${proxyImplementationAddress}) to version ${newProxyImplementationVersion} (at address ${codexRecordV2.address})...`)
              return codexRecordProxy.upgradeTo(newProxyImplementationVersion, codexRecordV2.address, { from: owner })
            })
        })

        // set fees and/or stake contract
        .then(() => {

          if (skipSetup) return null

          const proxiedCodexRecordV2 = CodexRecordV2.at(codexRecordProxyAddress)

          const promises = [

            // set setTokenURIPrefix, this might be unnecessary since data is
            // saved in the proxy?
            proxiedCodexRecordV2
              .setTokenURIPrefix(tokenURIPrefix, { from: owner })
              .then(() => {
                console.log(`✅ setTokenURIPrefix('${tokenURIPrefix}')`)
              })
              .catch((error) => {
                console.error(`❌ setTokenURIPrefix('${tokenURIPrefix}')`, error.message || error)
              }),

            ...feeOperators.map((feeOperator) => {
              return proxiedCodexRecordV2
                .addFeeOperator(feeOperator, { from: owner })
                .then(() => {
                  console.log(`✅ addFeeOperator('${feeOperator}')`)
                })
                .catch((error) => {
                  console.error(`❌ addFeeOperator('${feeOperator}')`, error.message || error)
                })
            }),
          ]

          // set fees, if specified
          if (codexCoinAddress !== null && feeRecipient !== null && creationFee !== null && transferFee !== null && modificationFee !== null) {
            promises.push(
              proxiedCodexRecordV2
                .setFees(codexCoinAddress, feeRecipient, creationFee, transferFee, modificationFee, { from: owner })
                .then(() => {
                  console.log(`✅ setFees('${codexCoinAddress}', '${feeRecipient}', ${creationFee}, ${transferFee}, ${modificationFee})`)
                })
                .catch((error) => {
                  console.error(`❌ setFees('${codexCoinAddress}', '${feeRecipient}', ${creationFee}, ${transferFee}, ${modificationFee})`, error.message || error)
                })
            )
          }

          // set stake contract, if specified
          if (codexStakeContractAddress) {
            promises.push(
              proxiedCodexRecordV2
                .setStakeContract(codexStakeContractAddress)
                .then(() => {
                  console.log(`✅ setStakeContract('${codexStakeContractAddress}')`)
                })
                .catch((error) => {
                  console.error(`❌ setStakeContract('${codexStakeContractAddress}')`, error.message || error)
                })
            )
          }

          return Promise.all(promises)

        })

    })
}
