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
    let stakeContract

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

      stakeContract = await CodexStakeContract.new(this.codexCoin.address, 7776000)
      await stakeContract.transferOwnership(this.token.address)

      await this.token.setStakeContract(stakeContract.address)
      await this.codexCoin.approve(stakeContract.address, web3.toWei(100, 'ether'))
    })

    describe('stakeContract', function () {
      it('exists', async function () {
        const codexStakeContract = await this.token.codexStakeContract()
        codexStakeContract.should.be.equal(stakeContract.address)
      })
    })

    describe('and CodexRecord is not approved to withdraw CODX', function () {
      describe('and the user has enough credits', function () {
        let originalBalance

        beforeEach(async function () {
          await stakeContract.stake(web3.toWei(1, 'ether'), 0x0)

          originalBalance = await stakeContract.creditBalanceOf(creator)
        })

        payableFunctions.forEach((payableFunction) => {
          it(`${payableFunction.name} should spend credits for transactions`, async function () {
            await this.token[payableFunction.name](...payableFunction.args)

            const tokenFee = await this.token[`${payableFunction.fee}Fee`]()
            const currentBalance = await stakeContract.creditBalanceOf(creator)

            currentBalance.should.be.bignumber.equal(originalBalance.minus(tokenFee))
          })
        })
      })

      describe('and the user does not have enough credits', function () {
        payableFunctions.forEach((payableFunction) => {
          it(`${payableFunction.name} should revert`, async function () {
            await assertRevert(this.token[payableFunction.name](...payableFunction.args))
          })
        })
      })
    })

    describe('and CodexRecord is approved to withdraw CODX', function () {
      it('should spend credits for transactions')
      it('should spend CODX if there are not enough credits')
      it('should revert if there are not enough credits or CODX')
    })
  })
}
