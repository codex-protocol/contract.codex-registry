export default async function modifyMetadataHashes({

  newNameHash,
  newFileHashes,
  newDescriptionHash,

  providerId = '',
  providerMetadataId = '',

  expectedNameHash = newNameHash,
  expectedFileHashes = newFileHashes,
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

  const expectedLogsLength = 1
  const expectedEventIndex = 0
  const { logs } = await this.token.modifyMetadataHashes(
    this.tokenId,
    newNameHash,
    newDescriptionHash,
    newFileHashes,
    providerId,
    providerMetadataId,
  )

  const tokenData = await this.token.getTokenById(this.tokenId)

  tokenData[0].should.be.equal(expectedNameHash)
  tokenData[1].should.be.equal(expectedDescriptionHash)
  tokenData[2].should.deep.equal(expectedFileHashes)

  // no Modified event is emitted when no provider details are specified
  if (!providerId && !providerMetadataId) {
    logs.length.should.be.equal(expectedLogsLength - 1)
    return
  }

  logs.length.should.be.equal(expectedLogsLength)

  logs[expectedEventIndex].event.should.be.eq('Modified')
  logs[expectedEventIndex].args._from.should.be.equal(this.creator)
  logs[expectedEventIndex].args._tokenId.should.be.bignumber.equal(this.tokenId)
  logs[expectedEventIndex].args._newNameHash.should.be.equal(tokenData[0])
  logs[expectedEventIndex].args._newDescriptionHash.should.be.equal(tokenData[1])
  logs[expectedEventIndex].args._newFileHashes.should.deep.equal(tokenData[2])
  logs[expectedEventIndex].args._providerId.should.be.equal(providerId)
  logs[expectedEventIndex].args._providerMetadataId.should.be.equal(providerMetadataId)
}
