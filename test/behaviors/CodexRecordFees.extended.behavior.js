import assertRevert from '../helpers/assertRevert'
import convertDataToBytes from '../helpers/convertDataToBytes'
import getCoreRegistryFunctions from '../helpers/getCoreRegistryFunctions'

const { BigNumber } = web3

const CodexCoin = artifacts.require('CodexCoin.sol')
const CodexStakeContract = artifacts.require('CodexStakeContract.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

export default function shouldBehaveLikeCodexRecordWithFeesExtended(accounts, inputs) {
  const creator = accounts[0]
  const communityFund = accounts[8]
  const firstTokenId = 0

  const fees = {
    creation: web3.toWei(3, 'ether'),
    transfer: web3.toWei(2, 'ether'),
    modification: web3.toWei(1, 'ether'),
  }

  const {
    hashedMetadata,
    data,
  } = inputs

  const dataAsBytes = convertDataToBytes(data)

  const payableFunctions = getCoreRegistryFunctions(
    accounts,
    firstTokenId,
    hashedMetadata,
    dataAsBytes,
  )

  describe('like a CodexRecord with fees & staking', function () {
    beforeEach(async function () {
      this.codexCoin = await CodexCoin.new()

      // pre-minting a token for use in some of the transfer tests
      await this.token.mint(
        creator,
        hashedMetadata.name,
        hashedMetadata.description,
        hashedMetadata.files,
        dataAsBytes,
      )

      // Set contract fees, sent to the community fund
      await this.token.setFees(
        this.codexCoin.address,
        communityFund,
        fees.creation,
        fees.transfer,
        fees.modification,
      )

      this.stakeContract = await CodexStakeContract.new(this.codexCoin.address, 7776000)
      await this.stakeContract.transferOwnership(this.token.address)

      await this.token.setStakeContract(this.stakeContract.address)
      await this.codexCoin.approve(this.stakeContract.address, web3.toWei(100, 'ether'))
    })

    describe('this.stakeContract', function () {
      it('exists', async function () {
        const codexStakeContract = await this.token.codexStakeContract()
        codexStakeContract.should.be.equal(this.stakeContract.address)
      })
    })

    describe('and CodexRecord is not approved to withdraw CODX', function () {
      describe('and the user has credits', function () {
        let originalBalance

        beforeEach(async function () {
          await this.stakeContract.stake(web3.toWei(2, 'ether'), 0x0)

          originalBalance = await this.stakeContract.creditBalanceOf(creator)
        })

        payableFunctions.forEach((payableFunction) => {
          it(`${payableFunction.name} should spend 1 credit`, async function () {
            await this.token[payableFunction.name](...payableFunction.args)

            const currentBalance = await this.stakeContract.creditBalanceOf(creator)
            currentBalance.should.be.bignumber.equal(originalBalance.minus(1))
          })
        })
      })

      describe('and the user does not have any credits', function () {
        payableFunctions.forEach((payableFunction) => {
          it(`${payableFunction.name} should revert`, async function () {
            await assertRevert(this.token[payableFunction.name](...payableFunction.args))
          })
        })
      })
    })

    describe('and CodexRecord is approved to withdraw CODX', function () {
      beforeEach(async function () {
        await this.codexCoin.approve(this.token.address, web3.toWei(100, 'ether'))
      })

      describe('should spend credits for transactions', function () {
        let originalBalance

        beforeEach(async function () {
          await this.stakeContract.stake(web3.toWei(1, 'ether'), 0x0)

          originalBalance = await this.stakeContract.creditBalanceOf(creator)
        })

        payableFunctions.forEach((payableFunction) => {
          it(`${payableFunction.name} should spend 1 credit`, async function () {
            await this.token[payableFunction.name](...payableFunction.args)

            const currentBalance = await this.stakeContract.creditBalanceOf(creator)
            currentBalance.should.be.bignumber.equal(originalBalance.minus(1))
          })
        })
      })

      describe('should spend CODX if there are not enough credits', function () {
        let originalBalance

        beforeEach(async function () {
          originalBalance = await this.codexCoin.balanceOf(creator)
        })

        payableFunctions.forEach((payableFunction) => {
          it(`${payableFunction.name} should spend CODX`, async function () {
            await this.token[payableFunction.name](...payableFunction.args)

            const currentBalance = await this.codexCoin.balanceOf(creator)
            currentBalance.should.be.bignumber.lt(originalBalance)
          })
        })
      })

      describe('should revert if there are not enough credits or CODX', function () {
        beforeEach(async function () {
          // Transfer all CODX out of the creator account
          const balance = await this.codexCoin.balanceOf(creator)
          await this.codexCoin.transfer(communityFund, balance)
        })

        payableFunctions.forEach((payableFunction) => {
          it(`${payableFunction.name} should revert`, async function () {
            await assertRevert(
              this.token[payableFunction.name](...payableFunction.args)
            )
          })
        })
      })
    })
  })
}
