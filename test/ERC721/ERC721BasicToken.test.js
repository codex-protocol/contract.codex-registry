// IMPORTANT NOTE: The web3 instance injected by Truffle is currently 0.2x.x
// Documentation here: https://github.com/ethereum/wiki/wiki/JavaScript-API

import shouldBehaveLikeERC721BasicToken from './ERC721BasicToken.behaviour';
import shouldMintERC721Token from './ERC721Mint.behaviour';

const BigNumber = web3.BigNumber;
const ERC721BasicToken = artifacts.require('ERC721BasicTokenMock.sol');
const TokenProxy = artifacts.require('TokenProxy.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721BasicToken', function (accounts) {
  beforeEach(async function () {
    const basicToken = await ERC721BasicToken.new({ from: accounts[0] });
    const proxy = await TokenProxy.new({ from: accounts[0] });
    await proxy.upgradeTo('1', basicToken.address);

    const version = await proxy.version();
    version.should.be.equal('1');

    const implementation = await proxy.implementation();
    implementation.should.be.equal(basicToken.address);

    this.token = ERC721BasicToken.at(proxy.address);
  });

  describe('like a ERC721BasicToken', function () {
    const firstTokenId = 1;
    const secondTokenId = 2;
    const creator = accounts[0];

    beforeEach(async function () {
      await this.token.mint(creator, firstTokenId, { from: creator });
      await this.token.mint(creator, secondTokenId, { from: creator });
    });

    describe('balanceOf', function () {
      describe('when the given address owns some tokens', function () {
        it('returns the amount of tokens owned by the given address', async function () {
          const balance = await this.token.balanceOf(creator);
          balance.should.be.bignumber.equal(2);
        });
      });

      describe('when the given address does not own any tokens', function () {
        it('returns 0', async function () {
          const balance = await this.token.balanceOf(accounts[1]);
          balance.should.be.bignumber.equal(0);
        });
      });
    });
  });

  shouldBehaveLikeERC721BasicToken(accounts);
  shouldMintERC721Token(accounts);
});
