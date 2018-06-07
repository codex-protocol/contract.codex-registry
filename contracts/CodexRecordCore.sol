pragma solidity 0.4.24;

import "./CodexRecordMetadata.sol";
import "./CodexRecordFees.sol";


/**
 * @title CodexRecordCore
 * @dev Core functionality of the token, namely minting.
 */
contract CodexRecordCore is CodexRecordFees {

  /**
   * @dev This event is emitted when a new token is minted and allows providers
   *  to discern which Minted events came from transactions they submitted vs
   *  transactions submitted by other platforms, as well as providing information
   *  about what metadata record the newly minted token should be associated with
   */
  event Minted(uint256 _tokenId, string _providerId, string _providerMetadataId);

  /**
   * @dev Sets the global tokenURIPrefix for use when returning token metadata.
   *  Only callable by the owner.
   * @param _tokenURIPrefix string The new tokenURIPrefix
   */
  function setTokenURIPrefix(string _tokenURIPrefix) external onlyOwner {
    tokenURIPrefix = _tokenURIPrefix;
  }

  /**
   * @dev Creates a new token
   * @param _to address The address the token will get transferred to after minting
   * @param _nameHash bytes32 The sha3 hash of the name
   * @param _descriptionHash bytes32 The sha3 hash of the description
   * @param _providerId string An ID that identifies which provider is
   *  minting this token
   * @param _providerMetadataId string An arbitrary provider-defined ID that
   *  identifies the metadata record stored by the provider
   */
  function mint(
    address _to,
    bytes32 _nameHash,
    bytes32 _descriptionHash,
    bytes32[] _fileHashes,
    string _providerId, // @TODO: convert to bytes32
    string _providerMetadataId  // @TODO: convert to bytes32
  )
    public
  {
    // For now, all new tokens will be the last entry in the array
    uint256 newTokenId = allTokens.length;

    // Add a new token to the allTokens array
    super._mint(_to, newTokenId);

    // Add metadata to the newly created token
    //
    // @TODO: evaluate gas costs here, it may be more efficient to push each
    //  individual file onto the existing fileHashes array for this index
    //  instead of replacing the array altogether
    tokenData[newTokenId] = CodexRecordData({
      nameHash: _nameHash,
      descriptionHash: _descriptionHash,
      fileHashes: _fileHashes
    });

    if (bytes(_providerId).length != 0 && bytes(_providerMetadataId).length != 0) {
      emit Minted(newTokenId, _providerId, _providerMetadataId);
    }
  }
}
