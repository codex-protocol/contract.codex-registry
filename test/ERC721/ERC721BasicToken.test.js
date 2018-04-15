import shouldBehaveLikeERC721BasicToken from './behaviors/ERC721BasicToken.behaviour';
import shouldMintERC721Token from './behaviors/ERC721Mint.behaviour';

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

    this.token = ERC721BasicToken.at(proxy.address);
  });

  shouldBehaveLikeERC721BasicToken(accounts);
  shouldMintERC721Token(accounts);
});
