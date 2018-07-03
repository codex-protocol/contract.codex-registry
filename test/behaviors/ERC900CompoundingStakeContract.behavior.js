import increaseTime from '../helpers/increaseTime'

const { BigNumber } = web3

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

export default function shouldBehaveLikeERC900CompoundingStakeContract(accounts, annualizedInterestRate) {
  const creator = accounts[0]

  describe('like a ERC900CompoundingStakeContract', function () {

    describe('annualizedInterestRate', function () {
      it('should exist', async function () {
        const interestRate = await this.stakeContract.annualizedInterestRate()
        interestRate.should.be.bignumber.equal(annualizedInterestRate)
      })
    })

    describe('stake', function () {
      describe('when a single stake is created', function () {
        const stakeAmount = web3.toWei(1, 'ether')

        beforeEach(async function () {
          await this.stakeContract.stake(stakeAmount, 0x0)
        })

        it('should be eligible for interest after 1 year', async function () {
          const yearInSeconds = await this.stakeContract.YEAR_IN_SECONDS()
          await increaseTime(yearInSeconds.toNumber() + 500) // adding some extra buffer

          const originalPerceivedAmounts = await this.stakeContract.getPersonalStakePerceivedAmounts(creator)
          originalPerceivedAmounts.length.should.be.bignumber.equal(1)
          originalPerceivedAmounts[0].should.be.bignumber.equal(stakeAmount)

          await this.stakeContract.collectInterest(creator)

          const intendedInterestRate = 1.1 // 10% interest rate
          const interestRate = await this.stakeContract.annualizedInterestRate()
          interestRate.should.be.bignumber.equal(web3.toWei(0.1, 'ether'))

          const newPerceivedAmounts = await this.stakeContract.getPersonalStakePerceivedAmounts(creator)
          newPerceivedAmounts.length.should.be.bignumber.equal(1)
          newPerceivedAmounts[0].should.be.bignumber.equal(originalPerceivedAmounts[0].times(intendedInterestRate))
        })
      })
    })

    describe('unstake', function () {
      const stakeAmount = web3.toWei(1, 'ether')

      describe('after interest has accrued', function () {
        let originalTotalStakedFor

        beforeEach(async function () {
          await this.stakeContract.stake(stakeAmount, 0x0)

          const yearInSeconds = await this.stakeContract.YEAR_IN_SECONDS()
          await increaseTime(yearInSeconds.toNumber() + 500) // adding some extra buffer

          await this.stakeContract.collectInterest(creator)

          originalTotalStakedFor = await this.stakeContract.totalStakedFor(creator)
        })

        it('correctly reduces total tokensStakedFor by the perceivedAmount', async function () {
          const perceivedAmounts = await this.stakeContract.getPersonalStakePerceivedAmounts(creator)
          perceivedAmounts.length.should.be.bignumber.equal(1)

          await this.stakeContract.unstake(stakeAmount, 0x0)

          const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
          totalStakedFor.should.be.bignumber.equal(originalTotalStakedFor.minus(perceivedAmounts[0]))
        })
      })
    })

    describe('collectInterest', function () {
      const intendedInterestRate = 1.1 // 10% interest rate
      const originalStakeAmount = web3.toWei(1, 'ether')
      let stakeAmountWithInterest

      beforeEach(async function () {
        await this.stakeContract.stake(originalStakeAmount, 0x0)

        const yearInSeconds = await this.stakeContract.YEAR_IN_SECONDS()
        await increaseTime(yearInSeconds.toNumber() + 500) // adding some extra buffer

        const originalPerceivedAmounts = await this.stakeContract.getPersonalStakePerceivedAmounts(creator)
        originalPerceivedAmounts.length.should.be.bignumber.equal(1)
        originalPerceivedAmounts[0].should.be.bignumber.equal(originalStakeAmount)

        await this.stakeContract.stake(originalStakeAmount, 0x0)
        await this.stakeContract.collectInterest(creator)

        const newPerceivedAmounts = await this.stakeContract.getPersonalStakePerceivedAmounts(creator)
        newPerceivedAmounts.length.should.be.bignumber.equal(2)

        stakeAmountWithInterest = newPerceivedAmounts[0]
        stakeAmountWithInterest.should.be.bignumber.equal(originalPerceivedAmounts[0].times(intendedInterestRate))
      })

      it('should not change the perceivedAmount for stakes that are not a year old', async function () {
        const perceivedAmounts = await this.stakeContract.getPersonalStakePerceivedAmounts(creator)
        perceivedAmounts.length.should.be.bignumber.equal(2)
        perceivedAmounts[1].should.be.bignumber.equal(originalStakeAmount)
      })

      it('should not change the perceivedAmount for stakes that have just received interest', async function () {
        await this.stakeContract.collectInterest(creator)

        const perceivedAmounts = await this.stakeContract.getPersonalStakePerceivedAmounts(creator)
        perceivedAmounts.length.should.be.bignumber.equal(2)
        perceivedAmounts[0].should.be.bignumber.equal(stakeAmountWithInterest)
      })

      it('should update the perceivedAmount for all personalStakes that are eligible for interest', async function () {
        await this.stakeContract.stake(originalStakeAmount, 0x0)
        await this.stakeContract.stake(originalStakeAmount, 0x0)

        const yearInSeconds = await this.stakeContract.YEAR_IN_SECONDS()
        await increaseTime(yearInSeconds.toNumber() + 500) // adding some extra buffer
        await this.stakeContract.collectInterest(creator)

        const perceivedAmounts = await this.stakeContract.getPersonalStakePerceivedAmounts(creator)
        perceivedAmounts.length.should.be.bignumber.equal(4)
        perceivedAmounts[0].should.be.bignumber.equal(stakeAmountWithInterest.times(intendedInterestRate))

        for (let i = 1; i < perceivedAmounts.length; i++) {
          perceivedAmounts[i].should.be.bignumber.equal(stakeAmountWithInterest)
        }
      })

      it('should receive interest after another year', async function () {
        const yearInSeconds = await this.stakeContract.YEAR_IN_SECONDS()
        await increaseTime(yearInSeconds.toNumber() + 500) // adding some extra buffer
        await this.stakeContract.collectInterest(creator)

        const perceivedAmounts = await this.stakeContract.getPersonalStakePerceivedAmounts(creator)
        perceivedAmounts.length.should.be.bignumber.equal(2)
        perceivedAmounts[0].should.be.bignumber.equal(stakeAmountWithInterest.times(intendedInterestRate))
      })

      it('should receive interest for every additional year of age (not compounding)', async function () {
        const yearInSeconds = await this.stakeContract.YEAR_IN_SECONDS()
        await increaseTime((yearInSeconds.toNumber() * 3) + 500) // adding some extra buffer

        await this.stakeContract.collectInterest(creator)

        const perceivedAmounts = await this.stakeContract.getPersonalStakePerceivedAmounts(creator)
        perceivedAmounts.length.should.be.bignumber.equal(2)

        // At this point, the first stake should have received 4 years of interest
        const stakeAmount = new BigNumber(originalStakeAmount)
        let compoundedInterestRate = (intendedInterestRate ** 4).toFixed(5)
        perceivedAmounts[0].should.be.bignumber.equal(stakeAmount.times(compoundedInterestRate))

        // And the second stake should have received 3 years of interest
        compoundedInterestRate = (intendedInterestRate ** 3).toFixed(5)
        perceivedAmounts[1].should.be.bignumber.equal(stakeAmount.times(compoundedInterestRate))
      })

      it('should update the tokensStakedFor of the intended recipient', async function () {
        const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
        totalStakedFor.should.be.bignumber.equal(new BigNumber(originalStakeAmount).plus(new BigNumber(stakeAmountWithInterest)))
      })

      it('should not update the totalStaked tokens in the contract', async function () {
        const totalStaked = await this.stakeContract.totalStaked()
        totalStaked.should.be.bignumber.equal(new BigNumber(originalStakeAmount).plus(new BigNumber(originalStakeAmount)))
      })

      it('should not update the actualAmount of tokens staked', async function () {
        const actualAmounts = await this.stakeContract.getPersonalStakeActualAmounts(creator)
        actualAmounts.length.should.be.bignumber.equal(2)

        for (let i = 0; i < actualAmounts.length; i++) {
          actualAmounts[i].should.be.bignumber.equal(originalStakeAmount)
        }
      })
    })
  })
}
