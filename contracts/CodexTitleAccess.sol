pragma solidity ^0.4.23;

import "./CodexTitleCore.sol";


/**
 * @title CodexTitleAccess
 * @dev Override contract functions
 */
contract CodexTitleAccess is CodexTitleCore {

  /**
  * @dev Make mint() pausable
  */
  function mint(
    address _to,
    bytes32 _nameHash,
    bytes32 _descriptionHash,
    bytes32 _imageHash,
    string _providerId, // TODO: convert to bytes32
    string _providerMetadataId) // TODO: convert to bytes32
    public
    whenNotPaused
  {
    return super.mint(_to, _nameHash, _descriptionHash, _imageHash, _providerId, _providerMetadataId);
  }
}
