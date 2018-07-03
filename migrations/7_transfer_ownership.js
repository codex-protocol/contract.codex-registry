const CodexRecord = artifacts.require('./CodexRecord.sol')
const CodexRecordProxy = artifacts.require('./CodexRecordProxy.sol')
const CodexStakeContract = artifacts.require('./CodexStakeContract.sol')

module.exports = async (deployer, network, accounts) => {

  deployer
    .then(async () => {
      let newOwner

      // The owner key should be stored securely in cold storage.
      switch (network) {
        case 'develop':
        case 'test':
        case 'coverage':
          return

        case 'ganache':
          newOwner = accounts[1]
          break

        case 'ropsten':
        case 'rinkeby':
          newOwner = '0xA7899114e93880A5790a68F9df66174FC038849a'
          break

        default:
          throw new Error('No ownership transfer defined for this network')
      }

      console.log('Transferring ownership')

      // Transfer ownership of CodexRecord from the perspective of CodexRecordProxy.
      // Initialization of this storage slot has already taken place earlier in migration
      //  because some operations (like setting the tokenURI) require owner permissions.
      const codexRecordProxy = await CodexRecordProxy.deployed()
      const proxiedCodexRecord = CodexRecord.at(codexRecordProxy.address)

      console.log('Transferring proxiedCodexRecord ownership to', newOwner)
      await proxiedCodexRecord.transferOwnership(newOwner)

      // Transfer ownership of CodexStakeContract to the proxy contract
      const stakeContract = await CodexStakeContract.deployed()

      console.log('Transferring stakeContract ownership to the proxy contract')
      await stakeContract.transferOwnership(newOwner)

      // For security, let's initialize the ownership of CodexRecord to newOwner as well.
      // This is a defensive action because no one should ever be interacting with CodexRecord
      //  directly, they should always be going through CodexRecordProxy.
      const codexRecord = await CodexRecord.deployed()
      console.log('Transferring codexRecord ownership to', newOwner)
      await codexRecord.initializeOwnable(newOwner)

      // Finally, transfer ownership of CodexRecordProxy from deployer to newOwner.
      // This is a crucial step in the process because the owner of CodexRecordProxy is the one
      //  that dictates future upgrades.
      console.log('Transferring codexRecordProxy proxy ownership to', newOwner)
      await codexRecordProxy.transferProxyOwnership(newOwner)
    })
    .catch((error) => {
      console.error(error)

      throw error
    })
}
