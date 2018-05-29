import assertRevert from '../../helpers/assertRevert'
import modifyMetadataHashesUnbound from '../../helpers/modifyMetadataHashes'

const { BigNumber } = web3
const CodexToken = artifacts.require('CodexToken.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

export default function shouldBehaveLikeCodexTitle(accounts) {

  const creator = accounts[0]
  const communityFund = accounts[8]
  const unauthorized = accounts[9]
  const firstTokenId = 0
  const providerId = '1'
  const providerMetadataId = '10'

  let modifyMetadataHashes // initialized per-test in beforeEach below

  const firstTokenMetadata = {
    name: 'First token',
    description: 'This is the first token',
    images: ['asdf'],
  }

  const hashedMetadata = {
    name: web3.sha3(firstTokenMetadata.name),
    description: web3.sha3(firstTokenMetadata.description),
    images: firstTokenMetadata.images.map((image) => {
      return web3.sha3(image)
    }),
  }

  describe('like a CodexTitle', function () {
    beforeEach(async function () {
      await this.token.mint(
        creator,
        hashedMetadata.name,
        hashedMetadata.description,
        hashedMetadata.images[0],
        providerId,
        providerMetadataId
      )

      const numTokens = await this.token.totalSupply()

      modifyMetadataHashes = modifyMetadataHashesUnbound.bind({
        creator,
        token: this.token,
        tokenId: numTokens - 1,
      })
    })

    describe('mint', function () {
      describe('when successful', function () {
        it('should create new tokens at the end of the allTokens array', async function () {
          const numTokens = await this.token.totalSupply()
          const tokenAtIndex = await this.token.tokenByIndex(numTokens - 1)
          tokenAtIndex.should.be.bignumber.equal(numTokens - 1)
        })

        it('should store the hashes at the minted tokens identifier', async function () {
          const tokenData = await this.token.getTokenById(0)
          tokenData[0].should.be.equal(hashedMetadata.name)
          tokenData[1].should.be.equal(hashedMetadata.description)
          tokenData[2].should.deep.equal(hashedMetadata.images)
        })
      })

      describe('when fees are enabled', function () {
        const fee = web3.toWei(1, 'ether')
        let codexToken
        let originalBalance

        beforeEach(async function () {
          codexToken = await CodexToken.new()

          // Set fees for creation to 1 CODX, sent to the community fund
          await this.token.setFees(codexToken.address, communityFund, fee)

          // Get original balance of the creator in CODX
          originalBalance = await codexToken.balanceOf(creator)
        })

        it('has a codexToken address', async function () {
          const tokenAddress = await this.token.codexTokenAddress()
          tokenAddress.should.be.equal(codexToken.address)
        })

        it('has a feeRecipient', async function () {
          const feeRecipient = await this.token.feeRecipient()
          feeRecipient.should.be.equal(communityFund)
        })

        it('has a creationFee', async function () {
          const creationFee = await this.token.creationFee()
          creationFee.should.be.bignumber.equal(fee)
        })

        describe('and the fee is paid', function () {
          beforeEach(async function () {
            // Set allowance to 10 tokens (using the web3 helpers for ether since it also has 18 decimal places)
            await codexToken.approve(this.token.address, web3.toWei(10, 'ether'))

            await this.token.mint(
              creator,
              hashedMetadata.name,
              hashedMetadata.description,
              hashedMetadata.images[0],
              providerId,
              providerMetadataId
            )
          })

          it('should create a new token', async function () {
            const numTokens = await this.token.totalSupply()
            numTokens.should.be.bignumber.equal(2)
          })

          it('should reduce the number of CODX in the minters balance by the creationFee', async function () {
            const creationFee = await this.token.creationFee()
            const currentBalance = await codexToken.balanceOf(creator)

            currentBalance.should.be.bignumber.equal(originalBalance.minus(creationFee))
          })
        })

        describe('and the fee is not paid', function () {
          it('should revert', async function () {
            await assertRevert(
              this.token.mint(
                creator,
                hashedMetadata.name,
                hashedMetadata.description,
                hashedMetadata.images[0],
                providerId,
                providerMetadataId,
              )
            )
          })
        })
      })
    })

    describe('modifyMetadataHashes', function () {

      const newNameHash = web3.sha3('New name')
      const newDescriptionHash = web3.sha3('New description')
      const newImageHashes = [web3.sha3('New image 1'), web3.sha3('New image 2')]

      describe('when the sender is not authorized', function () {
        it('should revert', async function () {
          await assertRevert(
            this.token.modifyMetadataHashes(
              0,
              newNameHash,
              newDescriptionHash,
              newImageHashes,
              providerId,
              providerMetadataId,
              { from: unauthorized },
            ),
          )
        })
      })

      describe('when called by the owner', function () {

        it('should update name hash only', async function () {
          await modifyMetadataHashes({
            newNameHash,
            newDescriptionHash: hashedMetadata.description,
            newImageHashes: [],

            providerId,
            providerMetadataId,

            expectedImageHashes: hashedMetadata.images,
          })
        })

        it('should update description hash only', async function () {
          await modifyMetadataHashes({
            newNameHash: '',
            newDescriptionHash,
            newImageHashes: [],

            providerId,
            providerMetadataId,

            expectedNameHash: hashedMetadata.name,
            expectedDescriptionHash: newDescriptionHash,
            expectedImageHashes: hashedMetadata.images,
          })
        })

        it('should remove description hash only', async function () {
          await modifyMetadataHashes({
            newNameHash: hashedMetadata.name,
            newDescriptionHash: '',
            newImageHashes: hashedMetadata.images,

            providerId,
            providerMetadataId,

            expectedDescriptionHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          })
        })

        it('should update image hashes only', async function () {
          await modifyMetadataHashes({
            newNameHash: '',
            newDescriptionHash: hashedMetadata.description,
            newImageHashes,

            providerId,
            providerMetadataId,

            expectedNameHash: hashedMetadata.name,
          })
        })

        it('should update all hashes', async function () {
          await modifyMetadataHashes({
            newNameHash,
            newDescriptionHash,
            newImageHashes,

            providerId,
            providerMetadataId,
          })
        })

        it('should update all hashes when no providerId & providerMetadataId are provided', async function () {
          await modifyMetadataHashes({
            newNameHash,
            newDescriptionHash,
            newImageHashes,
          })
        })
      })
    })

    describe('metadata', function () {
      it('should have the correct name', async function () {
        const name = await this.token.name()
        name.should.be.equal('Codex Title')
      })

      it('should have the correct symbol', async function () {
        const symbol = await this.token.symbol()
        symbol.should.be.equal('CT')
      })

      describe('tokenURI', function () {
        it('should be empty by default', async function () {
          const tokenURI = await this.token.tokenURI(firstTokenId)
          tokenURI.should.be.equal('')
        })

        describe('tokenURIPrefix', function () {
          const constantTokenURIPrefix = 'https://codexprotocol.com/token/'

          it('should be empty by default', async function () {
            const tokenURIPrefix = await this.token.tokenURIPrefix()
            tokenURIPrefix.should.be.equal('')
          })

          describe('when set by an address that is not the owner', function () {
            it('should fail', async function () {
              await assertRevert(this.token.setTokenURIPrefix(constantTokenURIPrefix, { from: unauthorized }))
            })
          })

          describe('when called by the owner', function () {
            beforeEach(async function () {
              await this.token.setTokenURIPrefix(constantTokenURIPrefix)
            })

            it('should update the URI for all tokens', async function () {
              const tokenURI = await this.token.tokenURI(firstTokenId)
              tokenURI.should.be.equal(`${constantTokenURIPrefix}${firstTokenId}`)
            })
          })
        })
      })
    })
  })
}
