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

  beforeEach(async function () {
    this.token = await CodexCoin.new()
    this.stakeContainer = await CodexStakeContainer.new(this.token.address, lockInDuration)

    await this.token.approve(this.stakeContainer.address, web3.toWei('100', 'ether'))
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
      tokenAddress.should.be.equal(this.token.address)
    })
  })

  describe('supportsHistory', function () {
    it('should return false', async function () {
      const supportsHistory = await this.stakeContainer.supportsHistory()
      supportsHistory.should.be.equal(false)
    })
  })

  describe('when a user stakes tokens', function () {
    beforeEach(async function () {
      await this.stakeContainer.stake(web3.toWei('1', 'ether'), 0x0)
    })

    describe('totalStaked', function () {
      it('should increase', async function () {
        const totalStaked = await this.stakeContainer.totalStaked()
        totalStaked.should.be.bignumber.equal(web3.toWei('1', 'ether'))
      })

      it('should be equivalent to balanceOf on the token contract', async function () {
        const totalStaked = await this.stakeContainer.totalStaked()
        const balanceOf = await this.token.balanceOf(this.stakeContainer.address)
        totalStaked.should.be.bignumber.equal(balanceOf)
      })

      it('should increase when another user stakes tokens', async function () {
        await this.token.transfer(otherUser, web3.toWei('50', 'ether'))

        await this.token.approve(
          this.stakeContainer.address,
          web3.toWei('100', 'ether'),
          { from: otherUser }
        )

        await this.stakeContainer.stake(web3.toWei('1', 'ether'), 0x0, { from: otherUser })

        const totalStaked = await this.stakeContainer.totalStaked()
        totalStaked.should.be.bignumber.equal(web3.toWei('2', 'ether'))
      })
    })

    describe('totalStakedFor', function () {
      it('should increase', async function () {
        const totalStakedFor = await this.stakeContainer.totalStakedFor(creator)
        totalStakedFor.should.be.bignumber.equal(web3.toWei('1', 'ether'))
      })

      it('should increase when another user stakes tokens on their behalf', async function () {
        await this.token.transfer(otherUser, web3.toWei('50', 'ether'))

        await this.token.approve(
          this.stakeContainer.address,
          web3.toWei('100', 'ether'),
          { from: otherUser }
        )

        await this.stakeContainer.stakeFor(
          creator,
          web3.toWei('1', 'ether'),
          0x0,
          { from: otherUser }
        )

        const totalStakedFor = await this.stakeContainer.totalStakedFor(creator)
        totalStakedFor.should.be.bignumber.equal(web3.toWei('2', 'ether'))
      })
    })

    describe('and then unstakes tokens', function () {
      beforeEach(async function () {
        // Changing the timestamp of the next block so the stake is unlocked
        const defaultDuration = await this.stakeContainer.defaultDuration()
        await increaseTime(defaultDuration.toNumber())

        await this.stakeContainer.unstake(web3.toWei('1', 'ether'), 0x0)
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
      const stakeAmount = web3.toWei('1', 'ether')
      let blockTimestamp

      beforeEach(async function () {
        const result = await this.stakeContainer.stake(stakeAmount, 0x0)
        const { blockNumber } = result.logs[0]
        blockTimestamp = web3.eth.getBlock(blockNumber).timestamp
      })

      it('should create a new personal stake with the correct properties', async function () {
        const personalStakeUnlockedTimestamps = await this.stakeContainer.getPersonalStakeUnlockedTimestamps(creator)
        personalStakeUnlockedTimestamps.length.should.be.bignumber.equal(1)
        personalStakeUnlockedTimestamps[0].should.be.bignumber.equal(blockTimestamp + lockInDuration)

        const personalStakeForAddresses = await this.stakeContainer.getPersonalStakeForAddresses(creator)
        personalStakeForAddresses.length.should.be.bignumber.equal(1)
        personalStakeForAddresses[0].should.be.equal(creator)

        const personalStakeAmounts = await this.stakeContainer.getPersonalStakeAmounts(creator)
        personalStakeAmounts.length.should.be.bignumber.equal(1)
        personalStakeAmounts[0].should.be.bignumber.equal(stakeAmount)
      })
    })

    describe('when multiple stakes are created', function () {
      it('should allow a user to create multiple stakes', async function () {
        this.stakeContainer.stake()
      })
    })

    it('should revert when the contract is not approved', async function () {
      const anotherStakeContainer = await CodexStakeContainer.new(this.token.address, lockInDuration)

      await assertRevert(
        anotherStakeContainer.stake(web3.toWei('1', 'ether'), 0x0)
      )
    })
  })
})
