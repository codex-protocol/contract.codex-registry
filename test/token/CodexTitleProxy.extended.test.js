import shouldBehaveLikeERC721BasicToken from './behaviors/ERC721BasicToken.behavior'
import shouldBehaveLikeERC721Token from './behaviors/ERC721Token.behavior'
import shouldMintERC721Token from './behaviors/ERC721Mint.behavior'

const { BigNumber } = web3
const CodexTitle = artifacts.require('CodexTitle.sol')
const CodexTitleProxy = artifacts.require('CodexTitleProxy.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexTitleProxy', async function (accounts) {
  const creator = accounts[0]

  const name = 'Non Fungible Token'
  const symbol = 'NFT'

  describe('proxying CodexTitle', function () {
    beforeEach(async function () {
      const token = await CodexTitle.new()
      this.proxy = await CodexTitleProxy.new(token.address)

      this.token = CodexTitle.at(this.proxy.address)
    })

    describe('should behave', function () {
      shouldBehaveLikeERC721BasicToken(accounts)
      shouldMintERC721Token(accounts)
      shouldBehaveLikeERC721Token(name, symbol, creator, accounts)
    })
  })
})
