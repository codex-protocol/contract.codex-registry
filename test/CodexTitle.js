const BigNumber = web3.BigNumber;

const CodexTitle = artifacts.require("CodexTitle");

require("chai")
  .use(require("chai-as-promised"))
  .use(require("chai-bignumber")(BigNumber))
  .should();

  contract('CodexTitle', accounts => {
    it('should have a name', () => {
      return CodexTitle.deployed().then(instance => {
        return instance.name();
      }).then(name => {
        name.should.be.equal('Codex Title');
      })
    })
  })