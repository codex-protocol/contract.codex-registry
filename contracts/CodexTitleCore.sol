pragma solidity ^0.4.23;

import "./CodexTitleMetadata.sol";
import "./CodexTitleFees.sol";


/**
 * @title CodexTitle, an ERC721 token for arts & collectables
 * @dev Developers should never interact with this smart contract directly!
 *  All transactions/calls should be made through TokenProxy. Storage will be maintained
 *  in that smart contract so that the Codex Protocol governing body has the ability
 *  to upgrade the contract in the future in the event of an emergency or new functionality.
 */
contract CodexTitleCore is CodexTitleMetadata, CodexTitleFees {

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
  * @param _tokenURIPrefix The new tokenURIPrefix
  */
  function setTokenURIPrefix(string _tokenURIPrefix) external onlyOwner {
    tokenURIPrefix = _tokenURIPrefix;
  }

  /**
  * @dev Creates a new token
  * @param _providerId (optional) An ID that identifies which provider is
  *  minting this token
  * @param _providerMetadataId (optional) An arbitrary provider-defined ID that
  *  identifies the metadata record sotred by the provider
  */
  function mint(
    address _to,
    bytes32 _nameHash,
    bytes32 _descriptionHash,
    bytes32 _imageHash,
    string _providerId, // TODO: convert to bytes32
    string _providerMetadataId) // TODO: convert to bytes32
    public
  {
    if (feeRecipient != address(0)) {
      require(
        codexToken.transferFrom(msg.sender, feeRecipient, creationFee),
        "Fee in CODX required");
    }

    // For now, all new tokens will be the last entry in the array
    uint256 newTokenId = allTokens.length;

    // Add a new token to the allTokens array
    super._mint(_to, newTokenId);

    // Add new token data to the newly created token
    // Note that we aren't using the struct here so we can directly write to the imageHashes dynamic storage array
    tokenData[newTokenId].nameHash = _nameHash;
    tokenData[newTokenId].descriptionHash = _descriptionHash;
    tokenData[newTokenId].imageHashes.push(_imageHash);

    if (bytes(_providerId).length != 0 && bytes(_providerMetadataId).length != 0) {
      emit Minted(newTokenId, _providerId, _providerMetadataId);
    }
  }
}
