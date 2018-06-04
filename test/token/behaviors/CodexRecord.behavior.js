import assertRevert from '../../helpers/assertRevert'
import modifyMetadataHashesUnbound from '../../helpers/modifyMetadataHashes'

const { BigNumber } = web3

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

export default function shouldBehaveLikeCodexRecord(accounts, metadata) {
  const creator = accounts[0]
  const unauthorized = accounts[9]
  const firstTokenId = 0

  const {
    hashedMetadata,
    providerId,
    providerMetadataId,
  } = metadata

  let modifyMetadataHashes // initialized per-test in beforeEach below

  describe('like a CodexRecord', function () {
    beforeEach(async function () {
      await this.token.mint(
        creator,
        hashedMetadata.name,
        hashedMetadata.description,
        hashedMetadata.files,
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
          tokenData[2].should.deep.equal(hashedMetadata.files)
        })
      })
    })

    describe('modifyMetadataHashes', function () {

      const newNameHash = web3.sha3('New name')
      const newDescriptionHash = web3.sha3('New description')
      const newFileHashes = [web3.sha3('new file data 1'), web3.sha3('new file data 2')]

      describe('when the sender is not authorized', function () {
        it('should revert', async function () {
          await assertRevert(
            this.token.modifyMetadataHashes(
              0,
              newNameHash,
              newDescriptionHash,
              newFileHashes,
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
            newFileHashes: [],

            providerId,
            providerMetadataId,

            expectedFileHashes: hashedMetadata.files,
          })
        })

        it('should update description hash only', async function () {
          await modifyMetadataHashes({
            newNameHash: '',
            newDescriptionHash,
            newFileHashes: [],

            providerId,
            providerMetadataId,

            expectedNameHash: hashedMetadata.name,
            expectedDescriptionHash: newDescriptionHash,
            expectedFileHashes: hashedMetadata.files,
          })
        })

        it('should remove description hash only', async function () {
          await modifyMetadataHashes({
            newNameHash: hashedMetadata.name,
            newDescriptionHash: '',
            newFileHashes: hashedMetadata.files,

            providerId,
            providerMetadataId,

            expectedDescriptionHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          })
        })

        it('should update file hashes only', async function () {
          await modifyMetadataHashes({
            newNameHash: '',
            newDescriptionHash: hashedMetadata.description,
            newFileHashes,

            providerId,
            providerMetadataId,

            expectedNameHash: hashedMetadata.name,
          })
        })

        it('should update all hashes', async function () {
          await modifyMetadataHashes({
            newNameHash,
            newDescriptionHash,
            newFileHashes,

            providerId,
            providerMetadataId,
          })
        })

        it('should update all hashes when no providerId & providerMetadataId are provided', async function () {
          await modifyMetadataHashes({
            newNameHash,
            newDescriptionHash,
            newFileHashes,
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
