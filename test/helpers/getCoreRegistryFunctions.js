const getCoreRegistryFunctions = (accounts, firstTokenId, hashedMetadata, dataAsBytes) => {
  const creator = accounts[0]
  const another = accounts[1]

  return [{
    name: 'mint',
    fee: 'creation',
    args: [
      creator,
      hashedMetadata.name,
      hashedMetadata.description,
      hashedMetadata.files,
      dataAsBytes,
    ],
  }, {
    name: 'transferFrom',
    fee: 'transfer',
    args: [
      creator,
      another,
      firstTokenId,
    ],
  }, {
    name: 'safeTransferFrom',
    fee: 'transfer',
    args: [
      creator,
      another,
      firstTokenId,
    ],
  }, {
    name: 'safeTransferFrom', // with data
    fee: 'transfer',
    args: [
      creator,
      another,
      firstTokenId,
      new Uint32Array(10),
    ],
  }, {
    name: 'modifyMetadataHashes',
    fee: 'modification',
    args: [
      firstTokenId,
      hashedMetadata.name,
      hashedMetadata.description,
      hashedMetadata.files,
      dataAsBytes,
    ],
  }]
}

export default getCoreRegistryFunctions
