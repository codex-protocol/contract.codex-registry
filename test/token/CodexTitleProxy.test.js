import assertRevert from '../helpers/assertRevert'

const { BigNumber } = web3
const ERC721Token = artifacts.require('ERC721TokenMock.sol')
const UpgradedToken = artifacts.require('UpgradedTokenMock.sol')
const CodexTitleProxy = artifacts.require('CodexTitleProxy.sol')


require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

/**
 * These tests are specifically designed to test the functionality in CodexTitleProxy.
 * i.e., constructor tests, upgradeTo tests, and fallback function tests.
 * Test cases covering the logistics of upgrading tokens are covered in ERC721CodexTitleProxy.test.js.
 */
contract('CodexTitleProxy', async function (accounts) {
  const creator = accounts[0]
  const notTheCreator = accounts[1]
  const name = 'Non Fungible Token'
  const symbol = 'NFT'
  const upgradedEvent = 'Upgraded'

  beforeEach(async function () {
    this.token = await ERC721Token.new(name, symbol, { from: creator })
    this.proxy = await CodexTitleProxy.new(this.token.address, { from: creator })
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
      this.upgradedToken = await UpgradedToken.new(name, symbol, { from: creator })
    })

    describe('when called by the owner', async function () {
      beforeEach(async function () {
        this.tx = await this.proxy.upgradeTo(newVersion, this.upgradedToken.address, { from: creator })
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
    const firstTokenId = '1'

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
          const upgradedToken = await UpgradedToken.new(name, symbol, { from: creator })
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
