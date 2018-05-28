import assertRevert from '../../helpers/assertRevert'

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

  describe('like a CodexTitle', function () {
    beforeEach(async function () {
      await this.token.mint(
        creator,
        hashedMetadata.name,
        hashedMetadata.description,
        hashedMetadata.imageBytes,
        providerId,
        providerMetadataId
      )
    })

    describe('mint', function () {
      describe('when successful', function () {
        it('should create new tokens at the end of the allTokens array', async function () {
          const numTokens = await this.token.totalSupply()
          const tokenId = await this.token.tokenByIndex(numTokens - 1)
          tokenId.should.be.bignumber.equal(numTokens - 1)
        })

        it('should store the hashes at the minted tokens identifier', async function () {
          const tokenData = await this.token.getTokenById(0)
          tokenData[0].should.be.equal(hashedMetadata.name)
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
              hashedMetadata.imageBytes,
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
                hashedMetadata.imageBytes,
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

          const { logs } = await this.token.modifyMetadataHashes(
            0,
            newNameHash,
            hashedMetadata.description,
            [],
            providerId,
            providerMetadataId,
          )

          const tokenData = await this.token.getTokenById(0)

          tokenData[0].should.be.equal(newNameHash)
          tokenData[1].should.be.equal(hashedMetadata.description)
          tokenData[2].should.deep.equal([hashedMetadata.imageBytes])

          // a Modified event is emitted when provider details are specified
          logs.length.should.be.equal(1)

          logs[0].event.should.be.eq('Modified')
          logs[0].args._from.should.be.equal(creator)
          logs[0].args._tokenId.should.be.bignumber.equal(0)
          logs[0].args._newNameHash.should.be.equal(tokenData[0])
          logs[0].args._newDescriptionHash.should.be.equal(tokenData[1])
          logs[0].args._newImageHashes.should.deep.equal(tokenData[2])
          logs[0].args._providerId.should.be.equal(providerId)
          logs[0].args._providerMetadataId.should.be.equal(providerMetadataId)

        })

        it('should update description hash only', async function () {

          const { logs } = await this.token.modifyMetadataHashes(
            0,
            '',
            newDescriptionHash,
            [],
            providerId,
            providerMetadataId,
          )

          const tokenData = await this.token.getTokenById(0)

          tokenData[0].should.be.equal(hashedMetadata.name)
          tokenData[1].should.be.equal(newDescriptionHash)
          tokenData[2].should.deep.equal([hashedMetadata.imageBytes])

          // a Modified event is emitted when provider details are specified
          logs.length.should.be.equal(1)

          logs[0].event.should.be.eq('Modified')
          logs[0].args._from.should.be.equal(creator)
          logs[0].args._tokenId.should.be.bignumber.equal(0)
          logs[0].args._newNameHash.should.be.equal(tokenData[0])
          logs[0].args._newDescriptionHash.should.be.equal(tokenData[1])
          logs[0].args._newImageHashes.should.deep.equal(tokenData[2])
          logs[0].args._providerId.should.be.equal(providerId)
          logs[0].args._providerMetadataId.should.be.equal(providerMetadataId)

        })

        it('should remove description hash only', async function () {

          const { logs } = await this.token.modifyMetadataHashes(
            0,
            hashedMetadata.name,
            '',
            [hashedMetadata.imageBytes],
            providerId,
            providerMetadataId,
          )

          const tokenData = await this.token.getTokenById(0)

          tokenData[0].should.be.equal(hashedMetadata.name)
          tokenData[1].should.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000')
          tokenData[2].should.deep.equal([hashedMetadata.imageBytes])

          // a Modified event is emitted when provider details are specified
          logs.length.should.be.equal(1)

          logs[0].event.should.be.eq('Modified')
          logs[0].args._from.should.be.equal(creator)
          logs[0].args._tokenId.should.be.bignumber.equal(0)
          logs[0].args._newNameHash.should.be.equal(tokenData[0])
          logs[0].args._newDescriptionHash.should.be.equal(tokenData[1])
          logs[0].args._newImageHashes.should.deep.equal(tokenData[2])
          logs[0].args._providerId.should.be.equal(providerId)
          logs[0].args._providerMetadataId.should.be.equal(providerMetadataId)

        })

        it('should update image hashes only', async function () {

          const { logs } = await this.token.modifyMetadataHashes(
            0,
            '',
            hashedMetadata.description,
            newImageHashes,
            providerId,
            providerMetadataId,
          )

          const tokenData = await this.token.getTokenById(0)

          tokenData[0].should.be.equal(hashedMetadata.name)
          tokenData[1].should.be.equal(hashedMetadata.description)
          tokenData[2].should.deep.equal(newImageHashes)

          // a Modified event is emitted when provider details are specified
          logs.length.should.be.equal(1)

          logs[0].event.should.be.eq('Modified')
          logs[0].args._from.should.be.equal(creator)
          logs[0].args._tokenId.should.be.bignumber.equal(0)
          logs[0].args._newNameHash.should.be.equal(tokenData[0])
          logs[0].args._newDescriptionHash.should.be.equal(tokenData[1])
          logs[0].args._newImageHashes.should.deep.equal(tokenData[2])
          logs[0].args._providerId.should.be.equal(providerId)
          logs[0].args._providerMetadataId.should.be.equal(providerMetadataId)

        })

        it('should update all hashes', async function () {

          const newNameHash2 = web3.sha3('New name 2')
          const newDescriptionHash2 = web3.sha3('New description 2')
          const newImageHashes2 = [web3.sha3('New image 2 1'), web3.sha3('New image 2 2')]

          const { logs } = await this.token.modifyMetadataHashes(
            0,
            newNameHash2,
            newDescriptionHash2,
            newImageHashes2,
            providerId,
            providerMetadataId,
          )

          const tokenData = await this.token.getTokenById(0)

          tokenData[0].should.be.equal(newNameHash2)
          tokenData[1].should.be.equal(newDescriptionHash2)
          tokenData[2].should.deep.equal(newImageHashes2)

          // a Modified event is emitted when provider details are specified
          logs.length.should.be.equal(1)

          logs[0].event.should.be.eq('Modified')
          logs[0].args._from.should.be.equal(creator)
          logs[0].args._tokenId.should.be.bignumber.equal(0)
          logs[0].args._newNameHash.should.be.equal(tokenData[0])
          logs[0].args._newDescriptionHash.should.be.equal(tokenData[1])
          logs[0].args._newImageHashes.should.deep.equal(tokenData[2])
          logs[0].args._providerId.should.be.equal(providerId)
          logs[0].args._providerMetadataId.should.be.equal(providerMetadataId)

        })

        it('should update all hashes when no providerId & providerMetadataId are provided', async function () {

          const newNameHash2 = web3.sha3('New name 2')
          const newDescriptionHash2 = web3.sha3('New description 2')
          const newImageHashes2 = [web3.sha3('New image 2 1'), web3.sha3('New image 2 2')]

          const { logs } = await this.token.modifyMetadataHashes(
            0,
            newNameHash2,
            newDescriptionHash2,
            newImageHashes2,
            '',
            '',
          )

          const tokenData = await this.token.getTokenById(0)

          tokenData[0].should.be.equal(newNameHash2)
          tokenData[1].should.be.equal(newDescriptionHash2)
          tokenData[2].should.deep.equal(newImageHashes2)

          // no Modified event is emitted when no provider details are specified
          logs.length.should.be.equal(0)
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
