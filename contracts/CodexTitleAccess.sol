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
    return super.mint(
      _to,
      _nameHash,
      _descriptionHash,
      _imageHash,
      _providerId,
      _providerMetadataId
    );
  }

  /**
  * @dev Make trasferFrom() pausable
  */
  function transferFrom(
    address _from,
    address _to,
    uint256 _tokenId)
    public
    whenNotPaused
  {
    return super.transferFrom(_from, _to, _tokenId);
  }

  /**
  * @dev Make safeTrasferFrom() pausable
  */
  function safeTransferFrom(
    address _from,
    address _to,
    uint256 _tokenId)
    public
    whenNotPaused
  {
    return super.safeTransferFrom(_from, _to, _tokenId);
  }

  /**
  * @dev Make safeTrasferFrom() pausable
  */
  function safeTransferFrom(
    address _from,
    address _to,
    uint256 _tokenId,
    bytes _data)
    public
    whenNotPaused
  {
    return super.safeTransferFrom(
      _from,
      _to,
      _tokenId,
      _data
    );
  }
}
