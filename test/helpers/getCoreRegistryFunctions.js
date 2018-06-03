const getCoreRegistryFunctions = (accounts, firstTokenId, metadata) => {
  const creator = accounts[0]
  const another = accounts[1]

  const {
    hashedMetadata,
    providerId,
    providerMetadataId,
  } = metadata

  return [{
    name: 'mint',
    fee: 'creation',
    args: [
      creator,
      hashedMetadata.name,
      hashedMetadata.description,
      hashedMetadata.files,
      providerId,
      providerMetadataId,
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
      providerId,
      providerMetadataId,
    ],
  }]
}

export default getCoreRegistryFunctions
