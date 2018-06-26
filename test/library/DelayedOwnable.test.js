import assertRevert from '../helpers/assertRevert'

const { BigNumber } = web3
const DelayedOwnable = artifacts.require('DelayedOwnable')

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('DelayedOwnable', function (accounts) {
  const creator = accounts[0]
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  let delayedOwnable

  beforeEach(async function () {
    delayedOwnable = await DelayedOwnable.new()
  })

  describe('before being initialized', function () {
    it('should have isInitialized set to false', async function () {
      const isInitialized = await delayedOwnable.isInitialized()
      isInitialized.should.be.equal(false)
    })

    it('should not have an owner', async function () {
      const owner = await delayedOwnable.owner()
      owner.should.be.equal(ZERO_ADDRESS)
    })
  })

  describe('after being initialized', function () {
    beforeEach(async function () {
      await delayedOwnable.initializeOwnable(creator)
    })

    it('should have an owner', async function () {
      const owner = await delayedOwnable.owner()
      owner.should.be.equal(creator)
    })

    it('changes owner after transfer', async function () {
      const other = accounts[1]
      await delayedOwnable.transferOwnership(other)

      const owner = await delayedOwnable.owner()
      owner.should.be.equal(other)
    })

    it('reverts when initializeOwnable is call more than once', async function () {
      await assertRevert(delayedOwnable.initializeOwnable(creator))
    })

    it('should prevent non-owners from transferring', async function () {
      const other = accounts[1]
      await assertRevert(delayedOwnable.transferOwnership(other, { from: other }))
    })

    it('should guard ownership against stuck state', async function () {
      await assertRevert(delayedOwnable.transferOwnership(ZERO_ADDRESS))
    })
  })
})
