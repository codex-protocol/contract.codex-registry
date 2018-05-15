
import assertRevert from '../helpers/assertRevert'

const Ownable = artifacts.require('Ownable')

contract('Ownable', function (accounts) {
  let ownable

  beforeEach(async function () {
    ownable = await Ownable.new()
  })

  it('should have an owner', async function () {
    const owner = await ownable.owner()
    assert.isTrue(owner !== 0)
  })

  it('changes owner after transfer', async function () {
    const other = accounts[1]
    await ownable.transferOwnership(other)
    const owner = await ownable.owner()

    assert.isTrue(owner === other)
  })

  it('should prevent non-owners from transfering', async function () {
    const other = accounts[2]
    const owner = await ownable.owner.call()
    assert.isTrue(owner !== other)
    await assertRevert(ownable.transferOwnership(other, { from: other }))
  })

  it('should guard ownership against stuck state', async function () {
    const originalOwner = await ownable.owner()
    await assertRevert(ownable.transferOwnership(null, { from: originalOwner }))
  })
})
