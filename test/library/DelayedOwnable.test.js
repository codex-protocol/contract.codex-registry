
import assertRevert from '../helpers/assertRevert'

const DelayedOwnable = artifacts.require('DelayedOwnable')

contract('DelayedOwnable', function (accounts) {
  let delayedOwnable

  beforeEach(async function () {
    delayedOwnable = await DelayedOwnable.new()
    await delayedOwnable.initializeOwnable(accounts[0])
  })

  it('should have an owner', async function () {
    const owner = await delayedOwnable.owner()
    assert.isTrue(owner !== 0)
  })

  it('changes owner after transfer', async function () {
    const other = accounts[1]
    await delayedOwnable.transferOwnership(other)
    const owner = await delayedOwnable.owner()

    assert.isTrue(owner === other)
  })

  it('should prevent non-owners from transfering', async function () {
    const other = accounts[2]
    const owner = await delayedOwnable.owner.call()
    assert.isTrue(owner !== other)
    await assertRevert(delayedOwnable.transferOwnership(other, { from: other }))
  })

  it('should guard ownership against stuck state', async function () {
    const originalOwner = await delayedOwnable.owner()
    await assertRevert(delayedOwnable.transferOwnership(null, { from: originalOwner }))
  })
})
