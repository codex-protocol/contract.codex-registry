const BigNumber = web3.BigNumber;
const ERC721BasicToken = artifacts.require('ERC721BasicTokenMock.sol');
const ERC721Token = artifacts.require('ERC721TokenMock.sol');
const TokenProxy = artifacts.require('TokenProxy.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('TokenProxy', async function (accounts) {
  const firstTokenId = 1;
  const secondTokenId = 2;
  const creator = accounts[0];
  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    const basicToken = await ERC721BasicToken.new({ from: creator });
    this.proxy = await TokenProxy.new({ from: creator });
    await this.proxy.upgradeTo('1', basicToken.address);

    this.token = ERC721BasicToken.at(this.proxy.address);
    await this.token.mint(creator, firstTokenId, { from: creator });
  });

  it('returns the amount of tokens owned by the given address', async function () {
    const balance = await this.token.balanceOf(creator);
    balance.should.be.bignumber.equal(1);
  });

  describe('upgrading to ERC721Token', function () {
    beforeEach(async function () {
      const token = await ERC721Token.new(name, symbol, { from: creator });
      await this.proxy.upgradeTo('1.1', token.address);

      this.token = ERC721Token.at(this.proxy.address);
      // await this.token.mint(creator, secondTokenId, { from: creator });
    });

    it('should be able to mint some tokens', async function () {
      let token = await this.token.tokenOfOwnerByIndex(creator, 0);
      token.toNumber().should.be.equal(firstTokenId);
      console.log('here2');

      token = await this.token.tokenOfOwnerByIndex(creator, 1);
      token.toNumber().should.be.equal(secondTokenId);
      console.log('here2');
    });

    it('returns the amount of tokens owned by the given address', async function () {
      const balance = await this.token.balanceOf(creator);
      balance.should.be.bignumber.equal(2);
    });
  });
});
