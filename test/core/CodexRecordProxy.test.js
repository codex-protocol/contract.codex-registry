import assertRevert from '../helpers/assertRevert'
import shouldBehaveLikeCodexRecord from '../behaviors/CodexRecord.behavior'
import shouldBehaveLikeCodexRecordWithFees from '../behaviors/CodexRecordFees.behavior'
import shouldBehaveLikeCodexRecordWithFeesExtended from '../behaviors/CodexRecordFees.extended.behavior'

const { BigNumber } = web3
const ERC721Token = artifacts.require('ERC721TokenMock.sol')
const UpgradedToken = artifacts.require('UpgradedTokenMock.sol')
const UpgradedTokenV2 = artifacts.require('UpgradedTokenMockV2.sol')
const CodexRecord = artifacts.require('CodexRecord.sol')
const CodexRecordProxy = artifacts.require('CodexRecordProxy.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexRecordProxy', async function (accounts) {
  const creator = accounts[0]
  const notTheCreator = accounts[1]

  const firstTokenId = '1'
  const name = 'Non Fungible Token'
  const symbol = 'NFT'

  const upgradedEvent = 'Upgraded'
  const transferEvent = 'Transfer'

  describe('proxying ERC721Token', function () {
    beforeEach(async function () {
      this.token = await ERC721Token.new(name, symbol)
      this.proxy = await CodexRecordProxy.new(this.token.address)
    })

    describe('when created', function () {
      it('should store the first version', async function () {
        const version = await this.proxy.version()
        version.should.be.equal('1')
      })

      it('should store the first implementation', async function () {
        const implementation = await this.proxy.implementation()
        implementation.should.be.equal(this.token.address)
      })
    })

    describe('upgradeTo', function () {
      const newVersion = '1.1'

      beforeEach(async function () {
        this.upgradedToken = await UpgradedToken.new(name, symbol)
      })

      describe('when called by the owner', async function () {
        beforeEach(async function () {
          this.tx = await this.proxy.upgradeTo(newVersion, this.upgradedToken.address)
        })

        it('should store the new version', async function () {
          const version = await this.proxy.version()
          version.should.be.equal(newVersion)
        })

        it('should store the new implementation', async function () {
          const implementation = await this.proxy.implementation()
          implementation.should.be.equal(this.upgradedToken.address)
        })

        it('should emit an Upgraded event', function () {
          this.tx.logs[0].event.should.equal(upgradedEvent)
        })
      })

      describe('when the implementation is the same', function () {
        it('should fail', async function () {
          await assertRevert(this.proxy.upgradeTo(newVersion, this.token.address))
        })
      })

      describe('when the implementation is the 0 address', function () {
        it('should fail', async function () {
          await assertRevert(this.proxy.upgradeTo(newVersion, '0'))
        })
      })

      describe('when the version is the same', function () {
        it('should fail', async function () {
          await assertRevert(this.proxy.upgradeTo('1', this.upgradedToken.address))
        })
      })

      describe('when called by an address not listed as the owner', function () {
        it('should fail', async function () {
          await assertRevert(
            this.proxy.upgradeTo(
              newVersion,
              this.upgradedToken.address,
              { from: notTheCreator }
            )
          )
        })
      })
    })

    describe('contract data', function () {
      let proxiedToken

      beforeEach(function () {
        proxiedToken = ERC721Token.at(this.proxy.address)
      })

      describe('when written by the proxy', function () {
        beforeEach(async function () {
          await proxiedToken.mint(creator, firstTokenId)
        })

        it('is stored in the proxy', async function () {
          const tokenBalance = await proxiedToken.totalSupply()
          tokenBalance.should.be.bignumber.equal(1)
        })

        it('is not stored in the original contract', async function () {
          const tokenBalance = await this.token.totalSupply()
          tokenBalance.should.be.bignumber.equal(0)
        })

        describe('and appended to through subsequent upgrades', function () {
          beforeEach(async function () {
            const upgradedToken = await UpgradedToken.new(name, symbol)
            this.proxy.upgradeTo('1.1', upgradedToken.address)

            proxiedToken = UpgradedToken.at(this.proxy.address)
          })

          it('still stores the original data', async function () {
            const tokenBalance = await proxiedToken.totalSupply()
            tokenBalance.should.be.bignumber.equal(1)
          })

          it('and also stores new contract data', async function () {
            const mintingFees = await proxiedToken.mintingFeesAccumulated()
            mintingFees.should.be.bignumber.equal(0)
          })
        })
      })

      describe('when written by the original contract', function () {
        beforeEach(async function () {
          await this.token.mint(creator, firstTokenId)
        })

        it('is not stored in the proxy', async function () {
          const tokenBalance = await this.token.totalSupply()
          tokenBalance.should.be.bignumber.equal(1)
        })

        it('is stored in the original contract', async function () {
          const tokenBalance = await proxiedToken.totalSupply()
          tokenBalance.should.be.bignumber.equal(0)
        })
      })
    })
  })

  describe('proxying UpgradedToken', function () {
    beforeEach(async function () {
      const token = await ERC721Token.new(name, symbol)
      this.proxy = await CodexRecordProxy.new(token.address)

      const upgradedToken = await UpgradedToken.new(name, symbol)
      await this.proxy.upgradeTo('1.1', upgradedToken.address)

      this.token = UpgradedToken.at(this.proxy.address)
      await this.token.initializeOwnable(creator)
    })

    describe('when called with no fee', function () {
      it('should fail', async function () {
        await assertRevert(this.token.mint(creator, firstTokenId))
      })
    })

    describe('when called with the correct fee', function () {
      let tx

      beforeEach(async function () {
        const requiredFee = await this.token.MINTING_FEE()
        tx = await this.token.mint(creator, firstTokenId, { value: requiredFee })
      })

      it('should emit the Transfer event', async function () {
        tx.logs[0].event.should.equal(transferEvent)
      })

      it('should store any fees accumulated in the smart contract', async function () {
        const fees = await this.token.mintingFeesAccumulated()
        const requiredFee = await this.token.MINTING_FEE()

        fees.should.be.bignumber.equal(requiredFee)
      })
    })

    describe('after upgraded to UpgradedTokenMockv2', function () {
      beforeEach(async function () {
        const upgradedTokenV2 = await UpgradedTokenV2.new(name, symbol)
        await this.proxy.upgradeTo('1.2', upgradedTokenV2.address)

        this.token = UpgradedTokenV2.at(this.proxy.address)
      })

      it('should allow minting without a fee', async function () {
        await this.token.mint(creator, firstTokenId)
      })
    })
  })

  describe('proxying CodexRecord', function () {
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
      const token = await CodexRecord.new()
      this.proxy = await CodexRecordProxy.new(token.address)

      this.token = CodexRecord.at(this.proxy.address)
      await this.token.initializeOwnable(creator)
    })

    describe('should behave', function () {
      shouldBehaveLikeCodexRecord(accounts, inputs)
      shouldBehaveLikeCodexRecordWithFees(accounts, inputs)
      shouldBehaveLikeCodexRecordWithFeesExtended(accounts, inputs)
    })
  })
})
