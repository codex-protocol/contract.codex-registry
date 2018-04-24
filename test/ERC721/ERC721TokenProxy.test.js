import assertRevert from '../helpers/assertRevert';
import shouldBehaveLikeERC721BasicToken from './behaviors/ERC721BasicToken.behavior';
import shouldBehaveLikeERC721Token from './behaviors/ERC721Token.behavior';
import shouldMintERC721Token from './behaviors/ERC721Mint.behavior';

const BigNumber = web3.BigNumber;
const ERC721Token = artifacts.require('ERC721TokenMock.sol');
const UpgradedToken = artifacts.require('UpgradedTokenMock.sol');
const TokenProxy = artifacts.require('TokenProxy.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Token via TokenProxy', async function (accounts) {
  const firstTokenId = 1;
  // const secondTokenId = 2;
  const creator = accounts[0];
  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    const token = await ERC721Token.new(name, symbol, { from: creator });
    this.proxy = await TokenProxy.new({ from: creator });
    await this.proxy.upgradeTo('1', token.address);

    this.token = ERC721Token.at(this.proxy.address);
  });

  describe('when upgraded', function () {
    beforeEach(async function () {
      const token = await UpgradedToken.new(name, symbol, { from: creator });
      await this.proxy.upgradeTo('1.1', token.address);

      this.token = UpgradedToken.at(this.proxy.address);
    });

    describe('mint', function () {
      it('should fail without a fee', async function () {
        await assertRevert(this.token.mint(creator, firstTokenId));
      });

      it('should succeed with the correct fee', async function () {
        const requiredFee = await this.token.MINTING_FEE();
        await this.token.mint(creator, firstTokenId, { value: requiredFee });
      });
    });
  });

  describe('should behave', function () {
    shouldBehaveLikeERC721BasicToken(accounts);
    shouldMintERC721Token(accounts);
    shouldBehaveLikeERC721Token(name, symbol, creator, accounts);
  });
});
