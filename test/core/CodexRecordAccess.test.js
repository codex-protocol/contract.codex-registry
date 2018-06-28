import assertRevert from '../helpers/assertRevert'
import convertDataToBytes from '../helpers/convertDataToBytes'
import getCoreRegistryFunctions from '../helpers/getCoreRegistryFunctions'

const { BigNumber } = web3
const CodexRecord = artifacts.require('CodexRecord.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexRecordAccess', async function (accounts) {
  const creator = accounts[0]
  const firstTokenId = 0
  const providerId = '1'
  const providerMetadataId = '10'

  const hashedMetadata = {
    name: web3.sha3('first token'),
    description: web3.sha3('this is the first token'),
    files: [web3.sha3('file data')],
  }

  const data = {
    providerId,
    providerMetadataId,
  }

  const dataAsBytes = convertDataToBytes(data)

  const pausableFunctions = getCoreRegistryFunctions(
    accounts,
    firstTokenId,
    hashedMetadata,
    dataAsBytes,
  )

  describe('when the contract is paused', function () {
    let token

    beforeEach(async function () {
      token = await CodexRecord.new()
      await token.initializeOwnable(creator)

      await token.mint(
        creator,
        hashedMetadata.name,
        hashedMetadata.description,
        hashedMetadata.files,
        dataAsBytes,
      )

      await token.pause()
    })

    describe('pausable functions should revert', function () {
      pausableFunctions.forEach((pausableFunction) => {
        it(pausableFunction.name, async () => {
          await assertRevert(
            token[pausableFunction.name](...pausableFunction.args)
          )
        })
      })
    })

    describe('and then unpaused', function () {
      beforeEach(async function () {
        await token.unpause()
      })

      describe('pausable functions should succeed', function () {
        pausableFunctions.forEach((pausableFunction) => {
          it(pausableFunction.name, async () => {
            await token[pausableFunction.name](...pausableFunction.args)
          })
        })
      })
    })
  })
})
