import assertRevert from '../helpers/assertRevert'
import increaseTime from '../helpers/increaseTime'

const { BigNumber } = web3

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

export default function shouldBehaveLikeERC900BasicStakeContract(accounts, lockInDuration) {
  const creator = accounts[0]
  const otherUser = accounts[1]

  describe('like a ERC900BasicStakeContract', function () {

    describe('totalStaked', function () {
      it('should be 0 by default', async function () {
        const totalStaked = await this.stakeContract.totalStaked()
        totalStaked.should.be.bignumber.equal(0)
      })
    })

    describe('totalStakedFor', function () {
      it('should be 0 by default', async function () {
        const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
        totalStakedFor.should.be.bignumber.equal(0)
      })
    })

    describe('token', function () {
      it('should return the address of the ERC20 token used for staking', async function () {
        const tokenAddress = await this.stakeContract.token()
        tokenAddress.should.be.equal(this.erc20Token.address)
      })
    })

    describe('supportsHistory', function () {
      it('should return false', async function () {
        const supportsHistory = await this.stakeContract.supportsHistory()
        supportsHistory.should.be.equal(false)
      })
    })

    describe('defaultLockInDuration', function () {
      it('should be the value passed in the constructor', async function () {
        const tokenLockInDuration = await this.stakeContract.defaultLockInDuration()
        tokenLockInDuration.should.be.bignumber.equal(lockInDuration)
      })
    })

    describe('when a user stakes tokens', function () {
      beforeEach(async function () {
        await this.stakeContract.stake(web3.toWei(1, 'ether'), 0x0)
      })

      describe('totalStaked', function () {
        it('should increase', async function () {
          const totalStaked = await this.stakeContract.totalStaked()
          totalStaked.should.be.bignumber.equal(web3.toWei(1, 'ether'))
        })

        it('should be equivalent to balanceOf on the token contract', async function () {
          const totalStaked = await this.stakeContract.totalStaked()
          const balanceOf = await this.erc20Token.balanceOf(this.stakeContract.address)
          totalStaked.should.be.bignumber.equal(balanceOf)
        })

        it('should increase when another user stakes tokens', async function () {
          await this.erc20Token.transfer(otherUser, web3.toWei(50, 'ether'))

          await this.erc20Token.approve(
            this.stakeContract.address,
            web3.toWei(100, 'ether'),
            { from: otherUser }
          )

          await this.stakeContract.stake(web3.toWei(1, 'ether'), 0x0, { from: otherUser })

          const totalStaked = await this.stakeContract.totalStaked()
          totalStaked.should.be.bignumber.equal(web3.toWei(2, 'ether'))
        })
      })

      describe('totalStakedFor', function () {
        it('should increase', async function () {
          const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
          totalStakedFor.should.be.bignumber.equal(web3.toWei(1, 'ether'))
        })

        it('should increase when another user stakes tokens on their behalf', async function () {
          await this.erc20Token.transfer(otherUser, web3.toWei(50, 'ether'))

          await this.erc20Token.approve(
            this.stakeContract.address,
            web3.toWei(100, 'ether'),
            { from: otherUser }
          )

          await this.stakeContract.stakeFor(
            creator,
            web3.toWei(1, 'ether'),
            0x0,
            { from: otherUser }
          )

          const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
          totalStakedFor.should.be.bignumber.equal(web3.toWei(2, 'ether'))
        })
      })

      describe('and then unstakes tokens', function () {
        beforeEach(async function () {
          // Changing the timestamp of the next block so the stake is unlocked
          const tokenLockInDuration = await this.stakeContract.defaultLockInDuration()
          await increaseTime(tokenLockInDuration.toNumber())

          await this.stakeContract.unstake(web3.toWei(1, 'ether'), 0x0)
        })

        describe('totalStaked', function () {
          it('should decrease', async function () {
            const totalStaked = await this.stakeContract.totalStaked()
            totalStaked.should.be.bignumber.equal(0)
          })
        })

        describe('totalStakedFor', function () {
          it('should decrease', async function () {
            const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
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
          tx = await this.stakeContract.stake(stakeAmount, 0x0)
          const { blockNumber } = tx.logs[0]
          blockTimestamp = web3.eth.getBlock(blockNumber).timestamp
        })

        it('should create a new personal stake with the correct properties', async function () {
          const personalStakeUnlockedTimestamps = await this.stakeContract.getPersonalStakeUnlockedTimestamps(creator)
          personalStakeUnlockedTimestamps.length.should.be.bignumber.equal(1)
          personalStakeUnlockedTimestamps[0].should.be.bignumber.equal(blockTimestamp + lockInDuration)

          const personalStakeForAddresses = await this.stakeContract.getPersonalStakeForAddresses(creator)
          personalStakeForAddresses.length.should.be.bignumber.equal(1)
          personalStakeForAddresses[0].should.be.equal(creator)

          const personalStakeAmounts = await this.stakeContract.getPersonalStakeActualAmounts(creator)
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
      })

      describe('when multiple stakes are created', function () {
        it('should allow a user to create multiple stakes', async function () {
          await this.stakeContract.stake(web3.toWei(1, 'ether'), 0x0)
        })
      })

      it('should revert when the contract is not approved', async function () {
        await this.erc20Token.decreaseApproval(this.stakeContract.address, web3.toWei(100, 'ether'))

        await assertRevert(
          this.stakeContract.stake(web3.toWei(1, 'ether'), 0x0)
        )
      })
    })

    describe('stakeFor', function () {
      describe('when a user stakes on behalf of another user', function () {
        const stakeAmount = web3.toWei(1, 'ether')
        let originalTotalStakedFor
        let tx

        beforeEach(async function () {
          originalTotalStakedFor = await this.stakeContract.totalStakedFor(creator)
          tx = await this.stakeContract.stakeFor(otherUser, stakeAmount, 0x0)
        })

        it('should create a personal stake for the staker', async function () {
          const personalStakeForAddresses = await this.stakeContract.getPersonalStakeForAddresses(creator)
          personalStakeForAddresses.length.should.be.bignumber.equal(1)
          personalStakeForAddresses[0].should.be.equal(otherUser)
        })

        it('should not change the number of tokens staked for the user', async function () {
          const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
          totalStakedFor.should.be.bignumber.equal(originalTotalStakedFor)
        })

        it('should increase the number of tokens staked for the other user', async function () {
          const totalStakedForOtherUser = await this.stakeContract.totalStakedFor(otherUser)
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
        await this.stakeContract.stake(web3.toWei(10, 'ether'), 0x0)
      })

      describe('when the stake is locked', function () {
        it('should revert', async function () {
          await assertRevert(
            this.stakeContract.unstake(web3.toWei(10, 'ether'), 0x0)
          )
        })
      })

      describe('when the unstake amount is incorrect', function () {
        it('should revert', async function () {
          await assertRevert(
            this.stakeContract.unstake(web3.toWei(1, 'ether'), 0x0)
          )
        })
      })

      describe('when the transfer from the contract fails', function () {
        it('should revert', async function () {
          // Pausing the token contract so that the transfer will fail
          await this.erc20Token.pause()

          // Changing the timestamp of the next block so the stake is unlocked
          const tokenLockInDuration = await this.stakeContract.defaultLockInDuration()
          await increaseTime(tokenLockInDuration.toNumber())

          await assertRevert(
            this.stakeContract.unstake(web3.toWei(10, 'ether'), 0x0)
          )
        })
      })

      describe('when called correctly', function () {
        const unstakeAmount = web3.toWei(10, 'ether')
        let tx
        let originalBalance

        beforeEach(async function () {
          const tokenLockInDuration = await this.stakeContract.defaultLockInDuration()
          await increaseTime(tokenLockInDuration.toNumber())

          originalBalance = await this.erc20Token.balanceOf(creator)

          tx = await this.stakeContract.unstake(unstakeAmount, 0x0)
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
          const personalStakeUnlockedTimestamps = await this.stakeContract.getPersonalStakeUnlockedTimestamps(creator)
          personalStakeUnlockedTimestamps.length.should.be.bignumber.equal(0)
        })

        it('should return the tokens back to the user', async function () {
          const newBalance = await this.erc20Token.balanceOf(creator)
          newBalance.should.be.bignumber.equal(originalBalance.add(web3.toWei(10, 'ether')))
        })
      })
    })
  })
}
