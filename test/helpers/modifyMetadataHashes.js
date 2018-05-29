export default async function modifyMetadataHashes({

  newNameHash,
  newImageHashes,
  newDescriptionHash,

  providerId = '',
  providerMetadataId = '',

  expectedNameHash = newNameHash,
  expectedImageHashes = newImageHashes,
  expectedDescriptionHash = newDescriptionHash,

}) {

  if (
    typeof this.token === 'undefined' ||
    typeof this.tokenId === 'undefined' ||
    typeof this.creator === 'undefined'
  ) {
    console.error('modifyMetadataHashes must be bound to a context that includes token, tokenId, and creator')
    return
  }

  const { logs } = await this.token.modifyMetadataHashes(
    this.tokenId,
    newNameHash,
    newDescriptionHash,
    newImageHashes,
    providerId,
    providerMetadataId,
  )

  const tokenData = await this.token.getTokenById(this.tokenId)

  tokenData[0].should.be.equal(expectedNameHash)
  tokenData[1].should.be.equal(expectedDescriptionHash)
  tokenData[2].should.deep.equal(expectedImageHashes)

  // no Modified event is emitted when no provider details are specified
  if (!providerId && !providerMetadataId) {
    logs.length.should.be.equal(0)
    return
  }

  logs.length.should.be.equal(1)

  logs[0].event.should.be.eq('Modified')
  logs[0].args._from.should.be.equal(this.creator)
  logs[0].args._tokenId.should.be.bignumber.equal(this.tokenId)
  logs[0].args._newNameHash.should.be.equal(tokenData[0])
  logs[0].args._newDescriptionHash.should.be.equal(tokenData[1])
  logs[0].args._newImageHashes.should.deep.equal(tokenData[2])
  logs[0].args._providerId.should.be.equal(providerId)
  logs[0].args._providerMetadataId.should.be.equal(providerMetadataId)

}
