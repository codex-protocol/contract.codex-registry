pragma solidity ^0.4.23;

import "./ERC721/ERC721Token.sol";
import "./ERC20/ERC20.sol";


/**
 * @title CodexTitleMetadata
 * @dev Storage, mutators, and modifiers for CodexTitle metadata.
 */
contract CodexTitleMetadata is ERC721Token {
  struct CodexTitleData {
    bytes32 nameHash;
    bytes32 descriptionHash;
    bytes32[] imageHashes;
  }

  enum ModifiedType {
    NAME_CHANGE,
    DESCRIPTION_CHANGE,
    IMAGE_NEW,
    IMAGE_DELETE
  }

  event Modified(address indexed _from, uint256 _tokenId, ModifiedType _type);

  // Mapping from token ID to token data
  mapping(uint256 => CodexTitleData) internal tokenData;

  // Global tokenURIPrefix prefix. The token ID will be appended to the uri when accessed
  //  via the tokenURI method
  string public tokenURIPrefix;

  /**
   * @dev Checks msg.sender can transfer a token, by being owner, approved, or operator
   * @param _tokenId uint256 ID of the token to validate
   */
  modifier canModify(uint256 _tokenId) {
    require(isApprovedOrOwner(msg.sender, _tokenId));
    _;
  }

  // TODO: Is it necessary to have a separate getter for this?
  function getImageHashByIndex(uint256 _tokenId, uint256 _index) external view returns (bytes32) {
    bytes32[] memory imageHashes;
    (,,imageHashes) = getTokenById(_tokenId);

    return imageHashes[_index];
  }

  function modifyDescriptionHash(uint256 _tokenId, bytes32 _newDescriptionHash) public canModify(_tokenId) {
    tokenData[_tokenId].descriptionHash = _newDescriptionHash;

    emit Modified(msg.sender, _tokenId, ModifiedType.DESCRIPTION_CHANGE);
  }

  function modifyNameHash(uint256 _tokenId, bytes32 _newNameHash) public canModify(_tokenId) {
    tokenData[_tokenId].nameHash = _newNameHash;

    emit Modified(msg.sender, _tokenId, ModifiedType.NAME_CHANGE);
  }

  function addNewImageHash(uint256 _tokenId, bytes32 _imageHash) public canModify(_tokenId) {
    tokenData[_tokenId].imageHashes.push(_imageHash);

    emit Modified(msg.sender, _tokenId, ModifiedType.IMAGE_NEW);
  }

  /**
   * @dev Gets the token given a token ID.
   * @param _tokenId token ID
   * @return CodexTitleData token data for the given token ID
   */
  function getTokenById(uint256 _tokenId) public view
    returns (bytes32 nameHash, bytes32 descriptionHash, bytes32[] imageHashes)
  {
    CodexTitleData storage codexTitle = tokenData[_tokenId];

    return (codexTitle.nameHash, codexTitle.descriptionHash, codexTitle.imageHashes);
  }

  /**
   * @dev Returns an URI for a given token ID
   * @dev Throws if the token ID does not exist.
   *
   * @dev To save on gas, we will host a standard metadata endpoint for each token.
   *  For Collector privacy, specific token metadata is stored off chain, which means
   *  the metadata returned by this endpoint cannot include specific details about
   *  the physical asset the token represents.
   *
   * @dev This metadata will a JSON blob that includes:
   *  name - Codex Title
   *  description - Information about the Provider that is hosting the off-chain metadata
   *  imageUri - A generic Codex Title image
   *
   * @param _tokenId uint256 ID of the token to query
   */
  function tokenURI(uint256 _tokenId) public view returns (string) {
    require(exists(_tokenId));

    bytes memory prefix = bytes(tokenURIPrefix);
    if (prefix.length == 0) {
      return "";
    }

    // Rather than store a string representation of _tokenId, we just convert it on the fly
    // since this is just a 'view' function (i.e., there's no gas cost if called off chain)
    bytes memory tokenId = uint2bytes(_tokenId);
    bytes memory output = new bytes(prefix.length + tokenId.length);

    // Index counters
    uint256 i;
    uint256 outputIndex = 0;

    // Copy over the prefix into the new bytes array
    for (i = 0; i < prefix.length; i++) {
      output[outputIndex++] = prefix[i];
    }

    // Copy over the tokenId into the new bytes array
    for (i = 0; i < tokenId.length; i++) {
      output[outputIndex++] = tokenId[i];
    }

    return string(output);
  }

  /**
   * @dev Based on MIT licensed code @ https://github.com/oraclize/ethereum-api
   * @dev Converts an incoming uint256 to a dynamic byte array
   */
  function uint2bytes(uint256 i) internal pure returns (bytes) {
    if (i == 0) {
      return "0";
    }

    uint256 j = i;
    uint256 length;
    while (j != 0) {
      length++;
      j /= 10;
    }

    bytes memory bstr = new bytes(length);
    uint256 k = length - 1;
    j = i;
    while (j != 0) {
      bstr[k--] = byte(48 + j % 10);
      j /= 10;
    }

    return bstr;
  }
}
