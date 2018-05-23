import assertRevert from '../helpers/assertRevert'

const { BigNumber } = web3
const CodexTitle = artifacts.require('CodexTitle.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('CodexTitleAccess', async function (accounts) {
  const creator = accounts[0]
  const another = accounts[1]
  const firstTokenId = 0
  const providerId = '1'
  const providerMetadataId = '10'

  const firstTokenMetadata = {
    name: 'First token',
    description: 'This is the first token',
    imageBytes: 'asdf',
  }

  const hashedMetadata = {
    name: web3.sha3(firstTokenMetadata.name),
    description: web3.sha3(firstTokenMetadata.description),
    imageBytes: web3.sha3(firstTokenMetadata.imageBytes),
  }

  beforeEach(async function () {
    this.token = await CodexTitle.new()
    await this.token.initializeOwnable(creator)

    await this.token.mint(
      creator,
      hashedMetadata.name,
      hashedMetadata.description,
      hashedMetadata.imageBytes,
      providerId,
      providerMetadataId,
    )
  })

  describe('mint', function () {
    describe('when contract paused', function () {
      beforeEach(async function () {
        // Pause the contract
        await this.token.pause()
      })

      it('should revert', async function () {
        await assertRevert(
          this.token.mint(
            creator,
            hashedMetadata.name,
            hashedMetadata.description,
            hashedMetadata.imageBytes,
            providerId,
            providerMetadataId,
          )
        )
      })
    })
  })

  describe('transferFrom', function () {
    describe('when contract paused', function () {
      beforeEach(async function () {
        // Pause the contract
        await this.token.pause()
      })

      it('should revert', async function () {
        await assertRevert(
          this.token.transferFrom(creator, another, firstTokenId)
        )
      })
    })

    describe('when contract unpaused', function () {
      beforeEach(async function () {
        // Pause the contract
        await this.token.pause()
      })

      it('allows transfer', async function () {
        await this.token.unpause()
        await this.token.transferFrom(creator, another, firstTokenId, { from: creator })
        const countAnother = await this.token.balanceOf(another)
        countAnother.should.be.bignumber.equal(1)
        const countCreator = await this.token.balanceOf(creator)
        countAnother.should.be.bignumber.equal(0)
      })
    })
  })

  describe('safeTransferFrom', function () {
    describe('when contract paused', function () {
      beforeEach(async function () {
        // Pause the contract
        await this.token.pause()
      })

      it('should revert', async function () {
        await assertRevert(
          this.token.safeTransferFrom(creator, another, firstTokenId)
        )
      })
    })
  })

  describe('safeTransferFrom with data', function () {
    const data = new Uint32Array(10)
    describe('when contract paused', function () {
      beforeEach(async function () {
        // Pause the contract
        await this.token.pause()
      })

      it('should revert', async function () {
        await assertRevert(
          this.token.safeTransferFrom(creator, another, firstTokenId, data)
        )
      })
    })
  })

  describe('modifyDescriptionHash', function () {
    const data = web3.sha3('description')
    describe('when contract paused', function () {
      beforeEach(async function () {
        // Pause the contract
        await this.token.pause()
      })

      it('should revert', async function () {
        await assertRevert(
          this.token.modifyDescriptionHash(firstTokenId, data)
        )
      })
    })
  })

  describe('modifyNameHash', function () {
    const data = web3.sha3('name')
    describe('when contract paused', function () {
      beforeEach(async function () {
        // Pause the contract
        await this.token.pause()
      })

      it('should revert', async function () {
        await assertRevert(
          this.token.modifyNameHash(firstTokenId, data, { from: creator })
        )
      })
    })
  })

  describe('addNewImageHash', function () {
    const data = web3.sha3('image')
    describe('when contract paused', function () {
      beforeEach(async function () {
        // Pause the contract
        await this.token.pause()
      })

      it('should revert', async function () {
        await assertRevert(
          this.token.addNewImageHash(firstTokenId, data, { from: creator })
        )
      })
    })
  })
})
