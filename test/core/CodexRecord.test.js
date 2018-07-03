import shouldBehaveLikeERC165 from '../behaviors/ERC165.behavior'
import shouldBehaveLikeCodexRecord from '../behaviors/CodexRecord.behavior'
import shouldBehaveLikeCodexRecordWithFees from '../behaviors/CodexRecordFees.behavior'
import shouldBehaveLikeCodexRecordWithFeesExtended from '../behaviors/CodexRecordFees.extended.behavior'

const { BigNumber } = web3
const CodexRecord = artifacts.require('CodexRecord.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexRecord', function (accounts) {
  const inputs = {
    hashedMetadata: {
      name: web3.sha3('First token'),
      description: web3.sha3('This is the first token'),
      files: [web3.sha3('file data')],
    },
    data: {
      providerId: '1',
      providerMetadataId: '10',
    },
  }

  beforeEach(async function () {
    this.token = await CodexRecord.new()
    await this.token.initializeOwnable(accounts[0])
  })

  shouldBehaveLikeERC165()

  // Base behavior, no fees
  shouldBehaveLikeCodexRecord(accounts, inputs)

  // Extended functionality & base behavior with fees enabled
  shouldBehaveLikeCodexRecordWithFees(accounts, inputs)

  // Extended functionality & base behavior with fees & staking enabled
  shouldBehaveLikeCodexRecordWithFeesExtended(accounts, inputs)
})
