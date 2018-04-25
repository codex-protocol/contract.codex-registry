import assertRevert from '../helpers/assertRevert';

const BigNumber = web3.BigNumber;
const CodexTitle = artifacts.require('CodexTitle.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CodexTitle', async function (accounts) {
  const creator = accounts[0];
  const unauthorized = accounts[9];

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
      hashedMetadata.imageBytes,
      '1',
      'metadataId');
  });

  describe('mint', function () {
    describe('when successful', function () {
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
  });

  describe('addNewImageHash', function () {
    const newImageHash = web3.sha3('abc123');

    describe('when called by the owner', function () {
      beforeEach(async function () {
        await this.token.addNewImageHash(0, newImageHash);
      });

      it('should add the new hash to the imageHashes array', async function () {
        const tokenData = await this.token.getTokenById(0);
        tokenData[2][1].should.be.equal(newImageHash);
        tokenData[2].length.should.be.equal(2);
      });
    });

    describe('when the sender is not authorized', function () {
      it('should revert', async function () {
        await assertRevert(this.token.addNewImageHash(0, newImageHash, { from: unauthorized }));
      });
    });
  });

  // TODO: Abstract this out into a generic pattern so it can also be used for description
  describe('modifyNameHash', function () {
    const newNameHash = web3.sha3('New name');

    describe('when called by the owner', function () {
      beforeEach(async function () {
        await this.token.modifyNameHash(0, newNameHash);
      });

      it('should succeed', async function () {
        const tokenData = await this.token.getTokenById(0);
        tokenData[0].should.be.equal(newNameHash);
      });
    });

    describe('when the sender is not authorized', function () {
      it('should revert', async function () {
        await assertRevert(this.token.modifyNameHash(0, newNameHash, { from: unauthorized }));
      });
    });
  });
});
