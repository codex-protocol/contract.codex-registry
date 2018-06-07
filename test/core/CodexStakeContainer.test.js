import increaseTime from '../helpers/increaseTime'
import assertRevert from '../helpers/assertRevert'

const { BigNumber } = web3

const CodexCoin = artifacts.require('CodexCoin.sol')
const CodexStakeContainer = artifacts.require('CodexStakeContainer.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexStakeContainer', function (accounts) {
  const creator = accounts[0]
  const otherUser = accounts[1]
  const lockInDuration = 7776000
  const annualizedInterestRate = web3.toWei(0.1, 'ether')

  beforeEach(async function () {
    this.codexCoin = await CodexCoin.new()
    this.stakeContainer = await CodexStakeContainer.new(this.codexCoin.address, lockInDuration, annualizedInterestRate)

    await this.codexCoin.approve(this.stakeContainer.address, web3.toWei(100, 'ether'))
  })

  describe('totalStaked', function () {
    it('should be 0 by default', async function () {
      const totalStaked = await this.stakeContainer.totalStaked()
      totalStaked.should.be.bignumber.equal(0)
    })
  })

  describe('totalStakedFor', function () {
    it('should be 0 by default', async function () {
      const totalStakedFor = await this.stakeContainer.totalStakedFor(creator)
      totalStakedFor.should.be.bignumber.equal(0)
    })
  })

  describe('token', function () {
    it('should return the address of the ERC20 token used for staking', async function () {
      const tokenAddress = await this.stakeContainer.token()
      tokenAddress.should.be.equal(this.codexCoin.address)
    })
  })

  describe('supportsHistory', function () {
    it('should return false', async function () {
      const supportsHistory = await this.stakeContainer.supportsHistory()
      supportsHistory.should.be.equal(false)
    })
  })

  describe('annualizedInterestRate', function () {
    it('should exist', async function () {
      const interestRate = await this.stakeContainer.annualizedInterestRate()
      interestRate.should.be.bignumber.equal(annualizedInterestRate)
    })

    it('should fail when not called by the owner', async function () {
      await assertRevert(
        this.stakeContainer.setAnnualizedInterestRate(web3.toWei(0.5, 'ether'), { from: otherUser })
      )
    })
  })

  describe('lockInDuration', function () {
    it('should be the value passed in the constructor', async function () {
      const tokenLockInDuration = await this.stakeContainer.lockInDuration()
      tokenLockInDuration.should.be.bignumber.equal(lockInDuration)
    })

    describe('when changed', function () {
      const newLockInDuration = lockInDuration * 2

      beforeEach(async function () {
        await this.stakeContainer.initializeOwnable(creator)
      })

      it('should fail when not called by the owner', async function () {
        await assertRevert(
          this.stakeContainer.setLockInDuration(newLockInDuration, { from: otherUser })
        )
      })

      it('should update when called by the owner', async function () {
        await this.stakeContainer.setLockInDuration(newLockInDuration)

        const tokenLockInDuration = await this.stakeContainer.lockInDuration()
        tokenLockInDuration.should.be.bignumber.equal(newLockInDuration)
      })
    })
  })

  describe('when a user stakes tokens', function () {
    beforeEach(async function () {
      await this.stakeContainer.stake(web3.toWei(1, 'ether'), 0x0)
    })

    describe('totalStaked', function () {
      it('should increase', async function () {
        const totalStaked = await this.stakeContainer.totalStaked()
        totalStaked.should.be.bignumber.equal(web3.toWei(1, 'ether'))
      })

      it('should be equivalent to balanceOf on the token contract', async function () {
        const totalStaked = await this.stakeContainer.totalStaked()
        const balanceOf = await this.codexCoin.balanceOf(this.stakeContainer.address)
        totalStaked.should.be.bignumber.equal(balanceOf)
      })

      it('should increase when another user stakes tokens', async function () {
        await this.codexCoin.transfer(otherUser, web3.toWei(50, 'ether'))

        await this.codexCoin.approve(
          this.stakeContainer.address,
          web3.toWei(100, 'ether'),
          { from: otherUser }
        )

        await this.stakeContainer.stake(web3.toWei(1, 'ether'), 0x0, { from: otherUser })

        const totalStaked = await this.stakeContainer.totalStaked()
        totalStaked.should.be.bignumber.equal(web3.toWei(2, 'ether'))
      })
    })

    describe('totalStakedFor', function () {
      it('should increase', async function () {
        const totalStakedFor = await this.stakeContainer.totalStakedFor(creator)
        totalStakedFor.should.be.bignumber.equal(web3.toWei(1, 'ether'))
      })

      it('should increase when another user stakes tokens on their behalf', async function () {
        await this.codexCoin.transfer(otherUser, web3.toWei(50, 'ether'))

        await this.codexCoin.approve(
          this.stakeContainer.address,
          web3.toWei(100, 'ether'),
          { from: otherUser }
        )

        await this.stakeContainer.stakeFor(
          creator,
          web3.toWei(1, 'ether'),
          0x0,
          { from: otherUser }
        )

        const totalStakedFor = await this.stakeContainer.totalStakedFor(creator)
        totalStakedFor.should.be.bignumber.equal(web3.toWei(2, 'ether'))
      })
    })

    describe('and then unstakes tokens', function () {
      beforeEach(async function () {
        // Changing the timestamp of the next block so the stake is unlocked
        const tokenLockInDuration = await this.stakeContainer.lockInDuration()
        await increaseTime(tokenLockInDuration.toNumber())

        await this.stakeContainer.unstake(web3.toWei(1, 'ether'), 0x0)
      })

      describe('totalStaked', function () {
        it('should decrease', async function () {
          const totalStaked = await this.stakeContainer.totalStaked()
          totalStaked.should.be.bignumber.equal(0)
        })
      })

      describe('totalStakedFor', function () {
        it('should decrease', async function () {
          const totalStakedFor = await this.stakeContainer.totalStakedFor(creator)
          totalStakedFor.should.be.bignumber.equal(0)
        })
      })
    })
  })

  describe('stake', function () {
    describe('when a single stake is created', function () {
      const stakeAmount = web3.toWei(1, 'ether')
      let blockTimestamp
      let tx

      beforeEach(async function () {
        tx = await this.stakeContainer.stake(stakeAmount, 0x0)
        const { blockNumber } = tx.logs[0]
        blockTimestamp = web3.eth.getBlock(blockNumber).timestamp
      })

      it('should create a new personal stake with the correct properties', async function () {
        const personalStakeUnlockedTimestamps = await this.stakeContainer.getPersonalStakeUnlockedTimestamps(creator)
        personalStakeUnlockedTimestamps.length.should.be.bignumber.equal(1)
        personalStakeUnlockedTimestamps[0].should.be.bignumber.equal(blockTimestamp + lockInDuration)

        const personalStakeForAddresses = await this.stakeContainer.getPersonalStakeForAddresses(creator)
        personalStakeForAddresses.length.should.be.bignumber.equal(1)
        personalStakeForAddresses[0].should.be.equal(creator)

        const personalStakeAmounts = await this.stakeContainer.getPersonalStakeActualAmounts(creator)
        personalStakeAmounts.length.should.be.bignumber.equal(1)
        personalStakeAmounts[0].should.be.bignumber.equal(stakeAmount)
      })

      it('should emit a Staked event', async function () {
        const { logs } = tx

        logs.length.should.be.equal(1)
        logs[0].event.should.be.equal('Staked')
        logs[0].args.user.should.be.equal(creator)
        logs[0].args.amount.should.be.bignumber.equal(stakeAmount)
        logs[0].args.total.should.be.bignumber.equal(stakeAmount)
        logs[0].args.data.should.be.equal('0x')
      })

      it('should be eligible for interest after 1 year', async function () {
        const yearInSeconds = await this.stakeContainer.YEAR_IN_SECONDS()
        await increaseTime(yearInSeconds.toNumber() + 500) // adding some extra buffer

        const originalPerceivedAmounts = await this.stakeContainer.getPersonalStakePerceivedAmounts(creator)
        originalPerceivedAmounts.length.should.be.bignumber.equal(1)
        originalPerceivedAmounts[0].should.be.bignumber.equal(stakeAmount)

        await this.stakeContainer.updatePerceivedStakeAmounts(creator)

        const intendedInterestRate = 1.1 // 10% interest rate
        const interestRate = await this.stakeContainer.annualizedInterestRate()
        interestRate.should.be.bignumber.equal(web3.toWei(0.1, 'ether'))

        const newPerceivedAmounts = await this.stakeContainer.getPersonalStakePerceivedAmounts(creator)
        newPerceivedAmounts.length.should.be.bignumber.equal(1)
        newPerceivedAmounts[0].should.be.bignumber.equal(originalPerceivedAmounts[0].times(intendedInterestRate))
      })
    })

    describe('when multiple stakes are created', function () {
      it('should allow a user to create multiple stakes', async function () {
        await this.stakeContainer.stake(web3.toWei(1, 'ether'), 0x0)
      })
    })

    it('should revert when the contract is not approved', async function () {
      const anotherStakeContainer = await CodexStakeContainer.new(this.codexCoin.address, lockInDuration, 10)

      await assertRevert(
        anotherStakeContainer.stake(web3.toWei(1, 'ether'), 0x0)
      )
    })
  })

  describe('stakeFor', function () {
    describe('when a user stakes on behalf of another user', function () {
      const stakeAmount = web3.toWei(1, 'ether')
      let originalTotalStakedFor
      let tx

      beforeEach(async function () {
        originalTotalStakedFor = await this.stakeContainer.totalStakedFor(creator)
        tx = await this.stakeContainer.stakeFor(otherUser, stakeAmount, 0x0)
      })

      it('should create a personal stake for the staker', async function () {
        const personalStakeForAddresses = await this.stakeContainer.getPersonalStakeForAddresses(creator)
        personalStakeForAddresses.length.should.be.bignumber.equal(1)
        personalStakeForAddresses[0].should.be.equal(otherUser)
      })

      it('should not change the number of tokens staked for the user', async function () {
        const totalStakedFor = await this.stakeContainer.totalStakedFor(creator)
        totalStakedFor.should.be.bignumber.equal(originalTotalStakedFor)
      })

      it('should increase the number of tokens staked for the other user', async function () {
        const totalStakedForOtherUser = await this.stakeContainer.totalStakedFor(otherUser)
        totalStakedForOtherUser.should.be.bignumber.equal(stakeAmount)
      })

      it('should emit a Staked event', async function () {
        const { logs } = tx

        logs.length.should.be.equal(1)
        logs[0].event.should.be.equal('Staked')
        logs[0].args.user.should.be.equal(otherUser)
        logs[0].args.amount.should.be.bignumber.equal(stakeAmount)
        logs[0].args.total.should.be.bignumber.equal(stakeAmount)
        logs[0].args.data.should.be.equal('0x')
      })
    })
  })

  describe('unstake', function () {
    beforeEach(async function () {
      await this.stakeContainer.stake(web3.toWei(10, 'ether'), 0x0)
    })

    describe('when the stake is locked', function () {
      it('should revert', async function () {
        await assertRevert(
          this.stakeContainer.unstake(web3.toWei(10, 'ether'), 0x0)
        )
      })
    })

    describe('when the unstake amount is incorrect', function () {
      it('should revert', async function () {
        await assertRevert(
          this.stakeContainer.unstake(web3.toWei(1, 'ether'), 0x0)
        )
      })
    })

    describe('when the transfer from the contract fails', function () {
      it('should revert', async function () {
        // Pausing the token contract so that the transfer will fail
        await this.codexCoin.initializeOwnable(creator)
        await this.codexCoin.pause()

        // Changing the timestamp of the next block so the stake is unlocked
        const tokenLockInDuration = await this.stakeContainer.lockInDuration()
        await increaseTime(tokenLockInDuration.toNumber())

        await assertRevert(
          this.stakeContainer.unstake(web3.toWei(10, 'ether'), 0x0)
        )
      })
    })

    describe('when called correctly', function () {
      const unstakeAmount = web3.toWei(10, 'ether')
      let tx
      let originalBalance

      beforeEach(async function () {
        const tokenLockInDuration = await this.stakeContainer.lockInDuration()
        await increaseTime(tokenLockInDuration.toNumber())

        originalBalance = await this.codexCoin.balanceOf(creator)

        tx = await this.stakeContainer.unstake(unstakeAmount, 0x0)
      })

      it('should emit an Unstaked event', async function () {
        const { logs } = tx

        logs.length.should.be.equal(1)
        logs[0].event.should.be.equal('Unstaked')
        logs[0].args.user.should.be.equal(creator)
        logs[0].args.amount.should.be.bignumber.equal(unstakeAmount)
        logs[0].args.total.should.be.bignumber.equal(0)
        logs[0].args.data.should.be.equal('0x')
      })

      it('should decrement the number of the personal stakes', async function () {
        const personalStakeUnlockedTimestamps = await this.stakeContainer.getPersonalStakeUnlockedTimestamps(creator)
        personalStakeUnlockedTimestamps.length.should.be.bignumber.equal(0)
      })

      it('should return the tokens back to the user', async function () {
        const newBalance = await this.codexCoin.balanceOf(creator)
        newBalance.should.be.bignumber.equal(originalBalance.add(web3.toWei(10, 'ether')))
      })
    })
  })

  describe('updatePerceivedStakeAmounts', function () {
    const intendedInterestRate = 1.1 // 10% interest rate
    const originalStakeAmount = web3.toWei(1, 'ether')
    let stakeAmountWithInterest

    beforeEach(async function () {
      await this.stakeContainer.stake(originalStakeAmount, 0x0)

      const yearInSeconds = await this.stakeContainer.YEAR_IN_SECONDS()
      await increaseTime(yearInSeconds.toNumber() + 500) // adding some extra buffer

      const originalPerceivedAmounts = await this.stakeContainer.getPersonalStakePerceivedAmounts(creator)
      originalPerceivedAmounts.length.should.be.bignumber.equal(1)
      originalPerceivedAmounts[0].should.be.bignumber.equal(originalStakeAmount)

      await this.stakeContainer.stake(originalStakeAmount, 0x0)
      await this.stakeContainer.updatePerceivedStakeAmounts(creator)

      const interestRate = await this.stakeContainer.annualizedInterestRate()
      interestRate.should.be.bignumber.equal(web3.toWei(0.1, 'ether'))

      const newPerceivedAmounts = await this.stakeContainer.getPersonalStakePerceivedAmounts(creator)
      newPerceivedAmounts.length.should.be.bignumber.equal(2)

      stakeAmountWithInterest = newPerceivedAmounts[0]
      stakeAmountWithInterest.should.be.bignumber.equal(originalPerceivedAmounts[0].times(intendedInterestRate))
    })

    it('should not change the perceivedAmount for stakes that are not a year old', async function () {
      const perceivedAmounts = await this.stakeContainer.getPersonalStakePerceivedAmounts(creator)
      perceivedAmounts.length.should.be.bignumber.equal(2)
      perceivedAmounts[1].should.be.bignumber.equal(originalStakeAmount)
    })

    it('should not change the perceivedAmount for stakes that have just received interest', async function () {
      await this.stakeContainer.updatePerceivedStakeAmounts(creator)

      const perceivedAmounts = await this.stakeContainer.getPersonalStakePerceivedAmounts(creator)
      perceivedAmounts.length.should.be.bignumber.equal(2)
      perceivedAmounts[0].should.be.bignumber.equal(stakeAmountWithInterest)
    })

    it('should update the perceivedAmount for all personalStakes that are eligible for interest', async function () {
      await this.stakeContainer.stake(originalStakeAmount, 0x0)
      await this.stakeContainer.stake(originalStakeAmount, 0x0)

      const yearInSeconds = await this.stakeContainer.YEAR_IN_SECONDS()
      await increaseTime(yearInSeconds.toNumber() + 500) // adding some extra buffer
      await this.stakeContainer.updatePerceivedStakeAmounts(creator)

      const perceivedAmounts = await this.stakeContainer.getPersonalStakePerceivedAmounts(creator)
      perceivedAmounts.length.should.be.bignumber.equal(4)
      perceivedAmounts[0].should.be.bignumber.equal(stakeAmountWithInterest.times(intendedInterestRate))

      for (let i = 1; i < perceivedAmounts.length; i++) {
        perceivedAmounts[i].should.be.bignumber.equal(stakeAmountWithInterest)
      }
    })

    it('should receive interest after another year', async function () {
      const yearInSeconds = await this.stakeContainer.YEAR_IN_SECONDS()
      await increaseTime(yearInSeconds.toNumber() + 500) // adding some extra buffer
      await this.stakeContainer.updatePerceivedStakeAmounts(creator)

      const perceivedAmounts = await this.stakeContainer.getPersonalStakePerceivedAmounts(creator)
      perceivedAmounts.length.should.be.bignumber.equal(2)
      perceivedAmounts[0].should.be.bignumber.equal(stakeAmountWithInterest.times(intendedInterestRate))
    })

    it('should receive interest for every additional year of age (not compounding)', async function () {
      const yearInSeconds = await this.stakeContainer.YEAR_IN_SECONDS()
      await increaseTime((yearInSeconds.toNumber() * 3) + 500) // adding some extra buffer

      await this.stakeContainer.updatePerceivedStakeAmounts(creator)

      const perceivedAmounts = await this.stakeContainer.getPersonalStakePerceivedAmounts(creator)
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
      const totalStakedFor = await this.stakeContainer.totalStakedFor(creator)
      totalStakedFor.should.be.bignumber.equal(new BigNumber(originalStakeAmount).plus(new BigNumber(stakeAmountWithInterest)))
    })

    it('should not update the totalStaked tokens in the contract', async function () {
      const totalStaked = await this.stakeContainer.totalStaked()
      totalStaked.should.be.bignumber.equal(new BigNumber(originalStakeAmount).plus(new BigNumber(originalStakeAmount)))
    })

    it('should not update the actualAmount of tokens staked', async function () {
      const actualAmounts = await this.stakeContainer.getPersonalStakeActualAmounts(creator)
      actualAmounts.length.should.be.bignumber.equal(2)

      for (let i = 0; i < actualAmounts.length; i++) {
        actualAmounts[i].should.be.bignumber.equal(originalStakeAmount)
      }
    })
  })
})
