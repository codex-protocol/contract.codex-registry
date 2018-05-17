import shouldBehaveLikeERC721BasicToken from './behaviors/ERC721BasicToken.behavior'
import shouldMintERC721Token from './behaviors/ERC721Mint.behavior'
import shouldBehaveLikeERC165 from './behaviors/ERC165.behavior'

const { BigNumber } = web3
const ERC721BasicToken = artifacts.require('ERC721BasicTokenMock.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('ERC721BasicToken should behave', function (accounts) {
  const name = 'Non Fungible Token'
  const symbol = 'NFT'
  const creator = accounts[0]

  beforeEach(async function () {
    this.token = await ERC721BasicToken.new({ from: accounts[0] })
  })

  shouldBehaveLikeERC721BasicToken(accounts)
  shouldMintERC721Token(accounts)
  shouldBehaveLikeERC165(name, symbol, creator, accounts)
})
