import assertRevert from '../helpers/assertRevert'
import getCoreRegistryFunctions from '../helpers/getCoreRegistryFunctions'

const { BigNumber } = web3

const CodexCoin = artifacts.require('CodexCoin.sol')
const CodexStakeContainer = artifacts.require('CodexStakeContainer.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

export default function shouldBehaveLikeCodexRecordWithFees(accounts, metadata) {
  const creator = accounts[0]
  const otherUser = accounts[1]
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

  describe('like a CodexRecord with fees', function () {
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

    describe('and staking is incorporated', function () {
      let stakeContainer

      beforeEach(async function () {
        stakeContainer = await CodexStakeContainer.new(this.codexCoin.address, 7776000)

        await this.token.setStakeContainer(stakeContainer.address)
        await this.token.setTokensNeededForFullDiscount(web3.toWei(10, 'ether'))

        await this.codexCoin.approve(stakeContainer.address, web3.toWei(100, 'ether'))
      })

      describe('stakeContainer', function () {
        it('exists', async function () {
          const codexStakeContainer = await this.token.codexStakeContainer()
          codexStakeContainer.should.be.equal(stakeContainer.address)
        })
      })

      describe('tokensNeededForFullDiscount', async function () {
        it('exists', async function () {
          const tokensNeededForFullDiscount = await this.token.tokensNeededForFullDiscount()
          tokensNeededForFullDiscount.should.be.bignumber.equal(web3.toWei(10, 'ether'))
        })

        it('fails to update if called by an unauthorized address', async function () {
          await assertRevert(
            this.token.setTokensNeededForFullDiscount(web3.toWei(100, 'ether'), { from: otherUser })
          )
        })
      })

      const testDiscount = async (codexCoin, token, expectedDiscount) => {
        if (expectedDiscount < 1) {
          // Since we aren't expecting fees to be completely eliminated, the token contract
          // still needs to get approved to withdraw some of the fees
          await codexCoin.approve(token.address, web3.toWei(100, 'ether'))
        }

        const tokensNeededForFullDiscount = await token.tokensNeededForFullDiscount()
        const amountToStake = tokensNeededForFullDiscount.times(expectedDiscount)
        await stakeContainer.stake(amountToStake, 0x0)

        const balanceAfterStaking = await codexCoin.balanceOf(creator)

        // Perform an operation that incurs fees
        await token.transferFrom(creator, otherUser, firstTokenId)

        const undiscountedFee = await token.transferFee()
        const currentBalance = await codexCoin.balanceOf(creator)
        const amountPaid = balanceAfterStaking.minus(currentBalance)

        amountPaid.should.be.bignumber.equal(undiscountedFee.times(1 - expectedDiscount))
      }

      it('should not reduce the fees paid if no tokens are staked', async function () {
        await testDiscount(this.codexCoin, this.token, 0)
      })

      it('should reduce the fees paid if some tokens are staked', async function () {
        await testDiscount(this.codexCoin, this.token, 0.50)
      })

      it('should eliminate fees if enough tokens are staked', async function () {
        await testDiscount(this.codexCoin, this.token, 1)
      })
    })

    describe('and the fee is not paid', function () {
      payableFunctions.forEach((payableFunction) => {
        it(`${payableFunction.name} should revert`, async function () {
          await assertRevert(this.token[payableFunction.name](...payableFunction.args))
        })
      })
    })
  })
}
