const BigNumber = web3.BigNumber

const CodexTitle = artifacts.require('CodexTitle')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexTitle', accounts => {
  let codexTitle = null
  const creator = accounts[0]
  //const otherAddress = accounts[1]

  beforeEach(async () => {
    codexTitle = await CodexTitle.new({ from: creator })
    await codexTitle.createNewDeed('Title 1', 'Description 1', {
      from: creator
    })
    await codexTitle.createNewDeed('Title 2', 'Description 2', {
      from: creator
    })
  })

  it('should have a name', async () => {
    const name = await codexTitle.name()
    name.should.be.equal('Codex Title')
  })

  it('should count the number of deeds created', async () => {
    const count = await codexTitle.countOfDeeds()
    count.should.be.bignumber.equal(2)
  })

  describe('createNewDeed', () => {
    it('should assign the creator as the owner and increase his deed count', async () => {
      const previousBalance = await codexTitle.countOfDeedsByOwner(creator)
      await codexTitle.createNewDeed('test', 'test', { from: creator })

      const numDeeds = await codexTitle.countOfDeeds()
      const owner = await codexTitle.ownerOf(numDeeds - 1)
      owner.should.be.equal(creator)

      const newBalance = await codexTitle.countOfDeedsByOwner(creator)
      newBalance.should.be.bignumber.equal(previousBalance.plus(1))
    })
  })

  it('should create a new deed with the given description and name', async () => {
    const name = 'name'
    const description = 'description'

    await codexTitle.createNewDeed(name, description, { from: creator })

    const numDeeds = await codexTitle.countOfDeeds()
    const deedData = await codexTitle.getDeedData(numDeeds - 1)
    deedData[0].should.be.equal(name)
    deedData[1].should.be.equal(description)
  })

  it('should emit a Minted event', async () => {
    const { logs } = await codexTitle.createNewDeed('test', 'test')
    const numDeeds = await codexTitle.countOfDeeds()

    logs.length.should.be.equal(1)
    logs[0].event.should.be.equal('Minted')
    logs[0].args.owner.should.be.equal(creator)
    logs[0].args.deedId.should.be.bignumber.equal(numDeeds.minus(1))
  })

  describe('transfer', () => {
    it('should allow owners to approve deeds for transfer')

    it('should disallow other addresses to approve deeds for transfer')

    it('should allow approved addresses to transfer deeds')
  })
})
