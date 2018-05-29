const CodexTitle = artifacts.require('./CodexTitle.sol')
const CodexTitleProxy = artifacts.require('./CodexTitleProxy.sol')

module.exports = async (deployer, network, accounts) => {

  deployer
    .deploy(CodexTitleProxy, CodexTitle.address)
    .then(async (codexTitleProxy) => {

      // Initialize the owner of CodexTitle from the perspective of CodexTitleProxy.
      // This places the owner of CodexTitle into a storage slot of CodexTitleProxy,
      //  meaning that function calls with the modifier onlyOwner will work as expected.
      const proxiedCodexTitle = CodexTitle.at(codexTitleProxy.address)
      await proxiedCodexTitle.initializeOwnable(accounts[0])
    })
    .catch((error) => {
      console.log(error)

      throw error
    })
}
