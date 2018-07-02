import shouldBehaveLikeBasicStakeContract from '../behaviors/ERC900BasicStakeContract.behavior'

const { BigNumber } = web3

const Erc20Token = artifacts.require('CodexCoin.sol')
const BasicStakeContract = artifacts.require('BasicStakeContractMock.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('ERC900BasicStakeContract', function (accounts) {
  const lockInDuration = 7776000

  beforeEach(async function () {
    this.erc20Token = await Erc20Token.new()
    this.stakeContract = await BasicStakeContract.new(this.erc20Token.address, lockInDuration)

    await this.erc20Token.approve(this.stakeContract.address, web3.toWei(100, 'ether'))
  })

  shouldBehaveLikeBasicStakeContract(accounts, lockInDuration)
})
