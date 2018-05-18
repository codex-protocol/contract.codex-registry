import assertRevert from '../helpers/assertRevert'
import shouldBehaveLikeERC165 from './behaviors/ERC165.behavior'
import shouldBehaveLikeCodexTitle from './behaviors/CodexTitle.behavior'

const { BigNumber } = web3
const ERC721Token = artifacts.require('ERC721TokenMock.sol')
const UpgradedToken = artifacts.require('UpgradedTokenMock.sol')
const UpgradedTokenV2 = artifacts.require('UpgradedTokenMockV2.sol')
const CodexTitle = artifacts.require('CodexTitle.sol')
const CodexTitleProxy = artifacts.require('CodexTitleProxy.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexTitleProxy', async function (accounts) {
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
      this.proxy = await CodexTitleProxy.new(this.token.address)
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
      let proxy

      beforeEach(function () {
        proxy = ERC721Token.at(this.proxy.address)
      })

      describe('when written by the proxy', function () {
        beforeEach(async function () {
          await proxy.mint(creator, firstTokenId)
        })

        it('is stored in the proxy', async function () {
          const tokenBalance = await proxy.totalSupply()
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

            proxy = UpgradedToken.at(this.proxy.address)
          })

          it('still stores the original data', async function () {
            const tokenBalance = await proxy.totalSupply()
            tokenBalance.should.be.bignumber.equal(1)
          })

          it('and also stores new contract data', async function () {
            const mintingFees = await proxy.mintingFeesAccumulated()
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
          const tokenBalance = await proxy.totalSupply()
          tokenBalance.should.be.bignumber.equal(0)
        })
      })
    })
  })

  describe('proxying UpgradedToken', function () {
    beforeEach(async function () {
      const token = await ERC721Token.new(name, symbol)
      this.proxy = await CodexTitleProxy.new(token.address)

      const upgradedToken = await UpgradedToken.new(name, symbol)
      await this.proxy.upgradeTo('1.1', upgradedToken.address)

      this.token = UpgradedToken.at(this.proxy.address)
    })

    describe('after upgraded to UpgradedTokenMock', function () {
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

        it('should allow the owner to withdraw any minting fees', async function () {
          const originalBalance = web3.eth.getBalance(creator)
          const requiredFee = await this.token.MINTING_FEE()

          await this.token.withdrawMintingFees()

          const newBalance = web3.eth.getBalance(creator)

          newBalance.should.be.bignumber.equal(originalBalance.add(requiredFee))
        })
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

  describe('proxying CodexTitle', function () {
    beforeEach(async function () {
      const token = await CodexTitle.new()
      this.proxy = await CodexTitleProxy.new(token.address)

      this.token = CodexTitle.at(this.proxy.address)
    })

    describe('should behave', function () {
      shouldBehaveLikeERC165()
      shouldBehaveLikeCodexTitle(accounts)
    })
  })
})
