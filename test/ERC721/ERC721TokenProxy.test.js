import assertRevert from '../helpers/assertRevert'
import shouldBehaveLikeERC721BasicToken from './behaviors/ERC721BasicToken.behavior'
import shouldBehaveLikeERC721Token from './behaviors/ERC721Token.behavior'
import shouldMintERC721Token from './behaviors/ERC721Mint.behavior'

const { BigNumber } = web3
const ERC721Token = artifacts.require('ERC721TokenMock.sol')
const UpgradedToken = artifacts.require('UpgradedTokenMock.sol')
const UpgradedTokenV2 = artifacts.require('UpgradedTokenMockV2.sol')
const TokenProxy = artifacts.require('TokenProxy.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('ERC721Token via TokenProxy', async function (accounts) {
  const firstTokenId = 100
  const creator = accounts[0]
  const name = 'Non Fungible Token'
  const symbol = 'NFT'
  const transferEvent = 'Transfer'

  beforeEach(async function () {
    const token = await ERC721Token.new(name, symbol, { from: creator })
    this.proxy = await TokenProxy.new(token.address, { from: creator })

    const upgradedToken = await UpgradedToken.new(name, symbol, { from: creator })
    await this.proxy.upgradeTo('1.1', upgradedToken.address)

    this.token = UpgradedToken.at(this.proxy.address)
  })

  describe('minting UpgradedTokenMock', function () {
    describe('when called with no fee', function () {
      it('should fail', async function () {
        await assertRevert(this.token.mint(creator, firstTokenId))
      })
    })

    describe('when called with the correct fee', function () {
      it('should emit the Transfer event', async function () {
        const requiredFee = await this.token.MINTING_FEE()
        const tx = await this.token.mint(creator, firstTokenId, { value: requiredFee })
        tx.logs[0].event.should.equal(transferEvent)
      })
    })
  })

  describe('UpgradedTokenMockv2', function () {
    beforeEach(async function () {
      const upgradedTokenV2 = await UpgradedTokenV2.new(name, symbol, { from: creator })
      await this.proxy.upgradeTo('1.2', upgradedTokenV2.address)

      this.token = UpgradedTokenV2.at(this.proxy.address)
    })

    describe('should behave', function () {
      shouldBehaveLikeERC721BasicToken(accounts)
      shouldMintERC721Token(accounts)
      shouldBehaveLikeERC721Token(name, symbol, creator, accounts)
    })
  })
})
