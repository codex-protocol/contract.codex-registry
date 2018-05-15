import shouldBehaveLikeERC721BasicToken from './behaviors/ERC721BasicToken.behavior'
import shouldBehaveLikeERC721Token from './behaviors/ERC721Token.behavior'
import shouldMintERC721Token from './behaviors/ERC721Mint.behavior'

const { BigNumber } = web3
const ERC721Token = artifacts.require('ERC721TokenMock.sol')
const TokenProxy = artifacts.require('TokenProxy.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('ERC721Token should behave', function (accounts) {
  const name = 'Non Fungible Token'
  const symbol = 'NFT'
  const creator = accounts[0]

  beforeEach(async function () {
    const token = await ERC721Token.new(name, symbol, { from: creator })
    const proxy = await TokenProxy.new({ from: creator })
    await proxy.upgradeTo('1', token.address)

    this.token = ERC721Token.at(proxy.address)
  })

  shouldBehaveLikeERC721BasicToken(accounts)
  shouldMintERC721Token(accounts)
  shouldBehaveLikeERC721Token(name, symbol, creator, accounts)
})
