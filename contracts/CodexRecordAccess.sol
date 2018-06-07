pragma solidity 0.4.24;

import "./CodexRecordCore.sol";


/**
 * @title CodexRecordAccess
 * @dev Override contract functions
 */
contract CodexRecordAccess is CodexRecordCore {

  /**
   * @dev Make mint() pausable
   */
  function mint(
    address _to,
    bytes32 _nameHash,
    bytes32 _descriptionHash,
    bytes32[] _fileHashes,
    string _providerId, // TODO: convert to bytes32
    string _providerMetadataId // TODO: convert to bytes32
  )
    public
    whenNotPaused
    canPayFees(creationFee)
  {
    return super.mint(
      _to,
      _nameHash,
      _descriptionHash,
      _fileHashes,
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
    uint256 _tokenId
  )
    public
    whenNotPaused
    canPayFees(transferFee)
  {
    return super.transferFrom(_from, _to, _tokenId);
  }

  /**
   * @dev Make safeTrasferFrom() pausable
   */
  function safeTransferFrom(
    address _from,
    address _to,
    uint256 _tokenId
  )
    public
    whenNotPaused
    canPayFees(transferFee)
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
    bytes _data
  )
    public
    whenNotPaused
    canPayFees(transferFee)
  {
    return super.safeTransferFrom(
      _from,
      _to,
      _tokenId,
      _data
    );
  }

  /**
   * @dev Make modifyMetadataHashes() pausable
   */
  function modifyMetadataHashes(
    uint256 _tokenId,
    bytes32 _newNameHash,
    bytes32 _newDescriptionHash,
    bytes32[] _newFileHashes,
    string _providerId, // TODO: convert to bytes32?
    string _providerMetadataId // TODO: convert to bytes32?
  )
    public
    whenNotPaused
    canPayFees(modificationFee)
  {
    return super.modifyMetadataHashes(
      _tokenId,
      _newNameHash,
      _newDescriptionHash,
      _newFileHashes,
      _providerId,
      _providerMetadataId
    );
  }
}
