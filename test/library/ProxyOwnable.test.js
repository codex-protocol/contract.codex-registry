
import assertRevert from '../helpers/assertRevert'

const ProxyOwnable = artifacts.require('ProxyOwnable')

contract('ProxyOwnable', function (accounts) {
  let proxyOwnable

  beforeEach(async function () {
    proxyOwnable = await ProxyOwnable.new()
  })

  it('should have an proxyOwner', async function () {
    const owner = await proxyOwnable.proxyOwner()
    assert.isTrue(owner !== 0)
  })

  it('changes owner after transfer', async function () {
    const other = accounts[1]
    await proxyOwnable.transferProxyOwnership(other)

    const proxyOwner = await proxyOwnable.proxyOwner()
    assert.isTrue(proxyOwner === other)
  })

  it('should prevent non-owners from transferring', async function () {
    const other = accounts[2]
    const proxyOwner = await proxyOwnable.proxyOwner()

    assert.isTrue(proxyOwner !== other)
    await assertRevert(proxyOwnable.transferProxyOwnership(other, { from: other }))
  })

  it('should guard ownership against stuck state', async function () {
    const originalOwner = await proxyOwnable.proxyOwner()
    await assertRevert(proxyOwnable.transferProxyOwnership(null, { from: originalOwner }))
  })
})
