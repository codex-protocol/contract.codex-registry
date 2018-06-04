const { BigNumber } = web3

const CodexCoin = artifacts.require('CodexCoin.sol')
const ERC900BasicStakeContainer = artifacts.require('ERC900BasicStakeContainer.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('ERC900BasicStakeContainer', function (accounts) {
  const creator = accounts[0]
  const otherUser = accounts[1]

  beforeEach(async function () {
    this.token = await CodexCoin.new()
    this.stakeContainer = await ERC900BasicStakeContainer.new(this.token.address)

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
        // @TODO: Update this test case to manipulate timestamp so that it can correctly test unstake
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
})
