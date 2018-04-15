import shouldBehaveLikeERC721BasicToken from './behaviors/ERC721BasicToken.behaviour';
import shouldBehaveLikeERC721Token from './behaviors/ERC721Token.bheavior';
import shouldMintERC721Token from './behaviors/ERC721Mint.behaviour';

const BigNumber = web3.BigNumber;
const ERC721Token = artifacts.require('ERC721TokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Token', function (accounts) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const creator = accounts[0];

  beforeEach(async function () {
    this.token = await ERC721Token.new(name, symbol, { from: creator });
  });

  shouldBehaveLikeERC721BasicToken(accounts);
  shouldMintERC721Token(accounts);
  shouldBehaveLikeERC721Token(name, symbol, creator, accounts);
});
