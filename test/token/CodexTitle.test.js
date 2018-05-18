import shouldBehaveLikeCodexTitle from './behaviors/CodexTitle.behavior'

const { BigNumber } = web3
const CodexTitle = artifacts.require('CodexTitle.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexTitle', function (accounts) {
  beforeEach(async function () {
    this.token = await CodexTitle.new()
    await this.token.initializeOwnable(accounts[0])
  })

  shouldBehaveLikeCodexTitle(accounts)
})
