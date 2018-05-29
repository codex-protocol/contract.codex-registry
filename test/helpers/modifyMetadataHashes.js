export default async function modifyMetadataHashes({

  newNameHash,
  newFileHashes,
  newDescriptionHash,

  providerId = '',
  providerMetadataId = '',

  expectedNameHash = newNameHash,
  expectedFileHashes = newFileHashes,
  expectedDescriptionHash = newDescriptionHash,

  feesEnabled = false,
}) {

  if (
    typeof this.token === 'undefined' ||
    typeof this.tokenId === 'undefined' ||
    typeof this.creator === 'undefined'
  ) {
    console.error('modifyMetadataHashes must be bound to a context that includes token, tokenId, and creator')
    return
  }

  // If fees are enabled, a Transfer event is fired in addition to the Modified event
  const expectedLogsLength = feesEnabled ? 2 : 1
  const logIndex = feesEnabled ? 1 : 0

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

  logs[logIndex].event.should.be.eq('Modified')
  logs[logIndex].args._from.should.be.equal(this.creator)
  logs[logIndex].args._tokenId.should.be.bignumber.equal(this.tokenId)
  logs[logIndex].args._newNameHash.should.be.equal(tokenData[0])
  logs[logIndex].args._newDescriptionHash.should.be.equal(tokenData[1])
  logs[logIndex].args._newFileHashes.should.deep.equal(tokenData[2])
  logs[logIndex].args._providerId.should.be.equal(providerId)
  logs[logIndex].args._providerMetadataId.should.be.equal(providerMetadataId)

}
