import assertRevert from '../../helpers/assertRevert'
import getCoreRegistryFunctions from '../../helpers/getCoreRegistryFunctions'

import shouldBehaveLikeCodexTitle from './CodexTitle.behavior'

const { BigNumber } = web3

const CodexCoin = artifacts.require('CodexCoin.sol')
const ERC900BasicStakeContainer = artifacts.require('ERC900BasicStakeContainer.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

export default function shouldBehaveLikeCodexTitleWithFees(accounts, metadata) {
  const creator = accounts[0]
  const communityFund = accounts[8]
  const firstTokenId = 0
  let originalBalance

  const fees = {
    creation: web3.toWei(3, 'ether'),
    transfer: web3.toWei(2, 'ether'),
    modification: web3.toWei(1, 'ether'),
  }

  const payableFunctions = getCoreRegistryFunctions(
    accounts,
    firstTokenId,
    metadata
  )

  describe('like a CodexTitle with fees', function () {
    beforeEach(async function () {
      this.codexCoin = await CodexCoin.new()

      // pre-minting a token for use in some of the transfer tests
      await this.token.mint(
        creator,
        metadata.hashedMetadata.name,
        metadata.hashedMetadata.description,
        metadata.hashedMetadata.files,
        metadata.providerId,
        metadata.providerMetadataId,
      )

      // Set contract fees, sent to the community fund
      await this.token.setFees(
        this.codexCoin.address,
        communityFund,
        fees.creation,
        fees.transfer,
        fees.modification,
      )

      // Get original balance of the creator in CODX
      originalBalance = await this.codexCoin.balanceOf(creator)
    })

    it('has a codexCoin address', async function () {
      const tokenAddress = await this.token.codexCoin()
      tokenAddress.should.be.equal(this.codexCoin.address)
    })

    it('has a feeRecipient', async function () {
      const feeRecipient = await this.token.feeRecipient()
      feeRecipient.should.be.equal(communityFund)
    })

    it('has a creationFee', async function () {
      const tokenFee = await this.token.creationFee()
      tokenFee.should.be.bignumber.equal(fees.creation)
    })

    it('has a transferFee', async function () {
      const tokenFee = await this.token.transferFee()
      tokenFee.should.be.bignumber.equal(fees.transfer)
    })

    it('has a modificationFee', async function () {
      const tokenFee = await this.token.modificationFee()
      tokenFee.should.be.bignumber.equal(fees.modification)
    })

    describe('and the fee is paid', function () {
      beforeEach(async function () {
        // Set allowance to 100 tokens (using the web3 helpers for ether since it also has 18 decimal places)
        await this.codexCoin.approve(this.token.address, web3.toWei(100, 'ether'))
      })

      payableFunctions.forEach((payableFunction) => {
        it(`${payableFunction.name} should succeed & reduce the number of CODX by the fee`, async function () {
          await this.token[payableFunction.name](...payableFunction.args)

          const tokenFee = await this.token[`${payableFunction.fee}Fee`]()
          const currentBalance = await this.codexCoin.balanceOf(creator)

          currentBalance.should.be.bignumber.equal(originalBalance.minus(tokenFee))
        })
      })
    })

    describe('and the fee is not paid', function () {
      payableFunctions.forEach((payableFunction) => {
        it(`${payableFunction.name} should revert`, async function () {
          await assertRevert(this.token[payableFunction.name](...payableFunction.args))
        })
      })
    })

    describe('and tokens are staked', function () {
      let stakeContainer

      beforeEach(async function () {
        stakeContainer = await ERC900BasicStakeContainer.new(this.codexCoin.address)

        await this.token.setStakeContainer(stakeContainer.address)

        // @TODO: once the staking logic is updated, approval of both contracts is needed to pay fees since it's a discount only
        // await this.codexCoin.approve(this.token.address, web3.toWei(100, 'ether'))
        await this.codexCoin.approve(stakeContainer.address, web3.toWei(100, 'ether'))

        await stakeContainer.stake(web3.toWei(1, 'ether'), '0x0')
      })

      shouldBehaveLikeCodexTitle(accounts, metadata, true)
    })
  })
}
