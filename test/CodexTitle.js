const BigNumber = web3.BigNumber

const CodexTitle = artifacts.require('CodexTitle')

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexTitle', accounts => {
  it('should have a name', () => {
    return CodexTitle.deployed()
      .then(instance => {
        return instance.name()
      })
      .then(name => {
        name.should.be.equal('Codex Title')
      })
  })

  it('should have an initial length of 0', () => {
    return CodexTitle.deployed()
      .then(instance => {
        return instance.countOfDeeds()
      })
      .then(count => {
        count.should.be.bignumber.equal(0)
      })
  })
})
