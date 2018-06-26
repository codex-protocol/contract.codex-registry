import assertRevert from '../helpers/assertRevert'

const DelayedPausableMock = artifacts.require('DelayedPausableMock')

contract('DelayedPausable', function (accounts) {
  const creator = accounts[0]

  it('can perform normal process in non-pause', async function () {
    const DelayedPausable = await DelayedPausableMock.new()
    await DelayedPausable.initializeOwnable(creator)

    const count0 = await DelayedPausable.count()
    assert.equal(count0, 0)

    await DelayedPausable.normalProcess()
    const count1 = await DelayedPausable.count()
    assert.equal(count1, 1)
  })

  it('can not perform normal process in pause', async function () {
    const DelayedPausable = await DelayedPausableMock.new()
    await DelayedPausable.initializeOwnable(creator)

    await DelayedPausable.pause()
    const count0 = await DelayedPausable.count()
    assert.equal(count0, 0)

    await assertRevert(DelayedPausable.normalProcess())
    const count1 = await DelayedPausable.count()
    assert.equal(count1, 0)
  })

  it('can not take drastic measure in non-pause', async function () {
    const DelayedPausable = await DelayedPausableMock.new()
    await DelayedPausable.initializeOwnable(creator)

    await assertRevert(DelayedPausable.drasticMeasure())
    const drasticMeasureTaken = await DelayedPausable.drasticMeasureTaken()
    assert.isFalse(drasticMeasureTaken)
  })

  it('can take a drastic measure in a pause', async function () {
    const DelayedPausable = await DelayedPausableMock.new()
    await DelayedPausable.initializeOwnable(creator)

    await DelayedPausable.pause()
    await DelayedPausable.drasticMeasure()
    const drasticMeasureTaken = await DelayedPausable.drasticMeasureTaken()

    assert.isTrue(drasticMeasureTaken)
  })

  it('should resume allowing normal process after pause is over', async function () {
    const DelayedPausable = await DelayedPausableMock.new()
    await DelayedPausable.initializeOwnable(creator)

    await DelayedPausable.pause()
    await DelayedPausable.unpause()
    await DelayedPausable.normalProcess()
    const count0 = await DelayedPausable.count()

    assert.equal(count0, 1)
  })

  it('should prevent drastic measure after pause is over', async function () {
    const DelayedPausable = await DelayedPausableMock.new()
    await DelayedPausable.initializeOwnable(creator)

    await DelayedPausable.pause()
    await DelayedPausable.unpause()

    await assertRevert(DelayedPausable.drasticMeasure())

    const drasticMeasureTaken = await DelayedPausable.drasticMeasureTaken()
    assert.isFalse(drasticMeasureTaken)
  })
})
