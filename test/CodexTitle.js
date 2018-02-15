const BigNumber = web3.BigNumber

const CodexTitle = artifacts.require('CodexTitle')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexTitle', accounts => {
  let codexTitle = null
  const creator = accounts[0]

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
      await codexTitle.createNewDeed('test', 'test', {
        from: creator
      })

      const numDeeds = await codexTitle.countOfDeeds()
      const owner = await codexTitle.ownerOf(numDeeds - 1)
      owner.should.be.equal(creator)

      const newBalance = await codexTitle.countOfDeedsByOwner(creator)
      newBalance.should.be.bignumber.equal(previousBalance.plus(1))
    })
  })
})
