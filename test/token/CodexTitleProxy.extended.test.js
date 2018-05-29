import shouldBehaveLikeERC721BasicToken from './behaviors/ERC721BasicToken.behavior'

const { BigNumber } = web3
const CodexTitle = artifacts.require('CodexTitle.sol')
const CodexTitleProxy = artifacts.require('CodexTitleProxy.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexTitleProxy', async function (accounts) {
  const creator = accounts[0]

  describe('proxying CodexTitle', function () {
    beforeEach(async function () {
      const token = await CodexTitle.new()
      this.proxy = await CodexTitleProxy.new(token.address)

      this.token = CodexTitle.at(this.proxy.address)
      await this.token.initializeOwnable(creator)
    })

    describe('should behave', function () {
      async function mintToken(tokenToMint, tokenCreator) {
        await tokenToMint.mint(
          tokenCreator,
          web3.sha3('name'),
          web3.sha3('description'),
          [web3.sha3('file data')],
          '1',
          '10'
        )
      }

      shouldBehaveLikeERC721BasicToken(accounts, mintToken)
    })
  })
})
