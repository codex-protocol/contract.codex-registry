// import assertRevert from '../helpers/assertRevert';

const BigNumber = web3.BigNumber;
const CodexTitle = artifacts.require('CodexTitle.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CodexTitle', async function (accounts) {
  const creator = accounts[0];

  const firstTokenMetadata = {
    name: 'First token',
    description: 'This is the first token',
    imageBytes: 'asdf',
  };

  const hashedMetadata = {
    name: web3.sha3(firstTokenMetadata.name),
    description: web3.sha3(firstTokenMetadata.description),
    imageBytes: web3.sha3(firstTokenMetadata.imageBytes),
  };

  beforeEach(async function () {
    this.token = await CodexTitle.new({ from: creator });

    await this.token.mint(
      creator,
      hashedMetadata.name,
      hashedMetadata.description,
      hashedMetadata.imageBytes);
  });

  describe('mint', function () {
    it('should create new tokens at the end of the allTokens array', async function () {
      const numTokens = await this.token.totalSupply();
      const tokenId = await this.token.tokenByIndex(numTokens - 1);
      tokenId.should.be.bignumber.equal(numTokens - 1);
    });

    it('should store the hashes at the minted tokens identifier', async function () {
      const tokenData = await this.token.getTokenById(0);
      tokenData[0].should.be.equal(hashedMetadata.name);
    });
  });

  describe('modify', function () {
    it('should allow the owner to add new image hashes to the token', async function () {
      const newImageHash = web3.sha3('abc123');
      await this.token.addNewImageHash(0, newImageHash);

      const tokenData = await this.token.getTokenById(0);
      tokenData[2][1].should.be.equal(newImageHash);
      tokenData[2].length.should.be.equal(2);
    });
  });
});
