import shouldMintERC721Token from './behaviors/ERC721Mint.behavior'
import shouldBehaveLikeERC721BasicToken from './behaviors/ERC721BasicToken.behavior'

const { BigNumber } = web3

const ERC721BasicToken = artifacts.require('ERC721BasicTokenMock.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('ERC721BasicToken should behave', function (accounts) {
  beforeEach(async function () {
    this.token = await ERC721BasicToken.new({ from: accounts[0] })
  })

  shouldBehaveLikeERC721BasicToken(accounts)
  shouldMintERC721Token(accounts)
})
