
import assertRevert from '../helpers/assertRevert'

const PausableMock = artifacts.require('PausableMock')

contract('Pausable', function (accounts) {
  const creator = accounts[0]

  it('can perform normal process in non-pause', async function () {
    const Pausable = await PausableMock.new()
    await Pausable.initializeOwnable(creator)

    const count0 = await Pausable.count()
    assert.equal(count0, 0)

    await Pausable.normalProcess()
    const count1 = await Pausable.count()
    assert.equal(count1, 1)
  })

  it('can not perform normal process in pause', async function () {
    const Pausable = await PausableMock.new()
    await Pausable.initializeOwnable(creator)

    await Pausable.pause()
    const count0 = await Pausable.count()
    assert.equal(count0, 0)

    await assertRevert(Pausable.normalProcess())
    const count1 = await Pausable.count()
    assert.equal(count1, 0)
  })

  it('can not take drastic measure in non-pause', async function () {
    const Pausable = await PausableMock.new()
    await Pausable.initializeOwnable(creator)

    await assertRevert(Pausable.drasticMeasure())
    const drasticMeasureTaken = await Pausable.drasticMeasureTaken()
    assert.isFalse(drasticMeasureTaken)
  })

  it('can take a drastic measure in a pause', async function () {
    const Pausable = await PausableMock.new()
    await Pausable.initializeOwnable(creator)

    await Pausable.pause()
    await Pausable.drasticMeasure()
    const drasticMeasureTaken = await Pausable.drasticMeasureTaken()

    assert.isTrue(drasticMeasureTaken)
  })

  it('should resume allowing normal process after pause is over', async function () {
    const Pausable = await PausableMock.new()
    await Pausable.initializeOwnable(creator)

    await Pausable.pause()
    await Pausable.unpause()
    await Pausable.normalProcess()
    const count0 = await Pausable.count()

    assert.equal(count0, 1)
  })

  it('should prevent drastic measure after pause is over', async function () {
    const Pausable = await PausableMock.new()
    await Pausable.initializeOwnable(creator)

    await Pausable.pause()
    await Pausable.unpause()

    await assertRevert(Pausable.drasticMeasure())

    const drasticMeasureTaken = await Pausable.drasticMeasureTaken()
    assert.isFalse(drasticMeasureTaken)
  })
})
