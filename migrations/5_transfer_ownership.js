const CodexTitle = artifacts.require('./CodexTitle.sol')
const TokenProxy = artifacts.require('./TokenProxy.sol')

module.exports = async (deployer, network, accounts) => {

  deployer
    .then(async () => {
      let newOwner

      // The owner key should be stored securely in cold storage.
      switch (network) {
        case 'develop':
          return

        case 'ganache':
          newOwner = accounts[1]
          break

        case 'rinkeby':
          newOwner = '0xA7899114e93880A5790a68F9df66174FC038849a'
          break

        default:
          throw new Error('No ownership transfer defined for this network')
      }

      // TODO: Should we transfer the ownership of CodexTitle itself too? Right now we are just transferring the proxy
      const tokenProxy = await TokenProxy.deployed()
      const codexTitle = CodexTitle.at(tokenProxy.address)

      console.log('Transferring ownership of CodexTitle via TokenProxy to: ', newOwner)

      codexTitle.transferOwnership(newOwner)
    })
    .catch((error) => {
      console.log(error)
    })
}
