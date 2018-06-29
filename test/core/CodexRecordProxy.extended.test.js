import convertDataToBytes from '../helpers/convertDataToBytes'
import shouldBehaveLikeERC721BasicToken from '../behaviors/ERC721BasicToken.behavior'

const { BigNumber } = web3
const CodexRecord = artifacts.require('CodexRecord.sol')
const CodexRecordProxy = artifacts.require('CodexRecordProxy.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexRecordProxy', async function (accounts) {
  const creator = accounts[0]

  describe('proxying CodexRecord', function () {
    beforeEach(async function () {
      const token = await CodexRecord.new()
      this.proxy = await CodexRecordProxy.new(token.address)

      this.token = CodexRecord.at(this.proxy.address)
      await this.token.initializeOwnable(creator)
    })

    describe('should behave', function () {
      const data = {
        providerId: '1',
        providerMetadataId: '10',
      }

      const dataAsBytes = convertDataToBytes(data)

      async function mintToken(tokenToMint, tokenCreator) {
        await tokenToMint.mint(
          tokenCreator,
          web3.sha3('name'),
          web3.sha3('description'),
          [web3.sha3('file data')],
          dataAsBytes,
        )
      }

      shouldBehaveLikeERC721BasicToken(accounts, mintToken)
    })
  })
})
