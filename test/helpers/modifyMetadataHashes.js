export default async function modifyMetadataHashes({

  newNameHash,
  newFileHashes,
  newDescriptionHash,

  rawData,
  dataAsBytes,

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
    dataAsBytes,
  )

  const tokenData = await this.token.getTokenById(this.tokenId)
  tokenData[0].should.be.equal(expectedNameHash)
  tokenData[1].should.be.equal(expectedDescriptionHash)
  tokenData[2].should.deep.equal(expectedFileHashes)

  logs.length.should.be.equal(expectedLogsLength)
  logs[expectedEventIndex].event.should.be.eq('Modified')
  logs[expectedEventIndex].args._from.should.be.equal(this.creator)
  logs[expectedEventIndex].args._tokenId.should.be.bignumber.equal(this.tokenId)
  logs[expectedEventIndex].args._newNameHash.should.be.equal(tokenData[0])
  logs[expectedEventIndex].args._newDescriptionHash.should.be.equal(tokenData[1])
  logs[expectedEventIndex].args._newFileHashes.should.deep.equal(tokenData[2])

  const data = logs[expectedEventIndex].args._data
  data.should.be.equal(dataAsBytes)

  if (rawData && dataAsBytes !== '0x') {
    const buffer = Buffer.from(data.substring(2), 'hex')
    const tokenizedData = buffer.toString('utf8').split(':::')
    let tokenIndex = 0

    Object.keys(rawData).forEach((key) => {
      rawData[key].should.be.equal(tokenizedData[tokenIndex])
      tokenIndex += 1
    })
  }
}
