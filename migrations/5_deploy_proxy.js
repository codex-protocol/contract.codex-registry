const CodexRecord = artifacts.require('./CodexRecord.sol')
const CodexRecordProxy = artifacts.require('./CodexRecordProxy.sol')

module.exports = async (deployer, network, accounts) => {

  deployer
    .deploy(CodexRecordProxy, CodexRecord.address)
    .then(async (codexRecordProxy) => {

      // Initialize the owner of CodexRecord from the perspective of CodexRecordProxy.
      // This places the owner of CodexRecord into a storage slot of CodexRecordProxy,
      //  meaning that function calls with the modifier onlyOwner will work as expected.
      const proxiedCodexRecord = CodexRecord.at(codexRecordProxy.address)
      await proxiedCodexRecord.initializeOwnable(accounts[0])
    })
    .catch((error) => {
      console.log(error)

      throw error
    })
}
