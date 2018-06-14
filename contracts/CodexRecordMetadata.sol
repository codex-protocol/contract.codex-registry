pragma solidity 0.4.24;

import "./ERC721/ERC721Token.sol";
import "./ERC20/ERC20.sol";


/**
 * @title CodexRecordMetadata
 * @dev Storage, mutators, and modifiers for CodexRecord metadata.
 */
contract CodexRecordMetadata is ERC721Token {
  struct CodexRecordData {
    bytes32 nameHash;
    bytes32 descriptionHash;
    bytes32[] fileHashes;
  }

  event Modified(
    address indexed _from,
    uint256 _tokenId,
    bytes32 _newNameHash,
    bytes32 _newDescriptionHash,
    bytes32[] _newFileHashes,
    string _providerId, // TODO: convert to bytes32?
    string _providerMetadataId // TODO: convert to bytes32?
  );

  // Mapping from token ID to token data
  mapping(uint256 => CodexRecordData) internal tokenData;

  // Global tokenURIPrefix prefix. The token ID will be appended to the uri when accessed
  //  via the tokenURI method
  string public tokenURIPrefix;

  /**
   * @dev Modifier that checks to see if the token exists
   * @param _tokenId uint256 The token ID
   */
  modifier tokenExists(uint256 _tokenId) {
    require(
      exists(_tokenId),
      "Token doesn't exist");
    _;
  }

  /**
   * @dev Updates token metadata hashes to whatever is passed in
   * @param _tokenId uint256 The token ID
   * @param _newNameHash bytes32 The new sha3 hash of the name
   * @param _newDescriptionHash bytes32 The new sha3 hash of the description
   * @param _newFileHashes bytes32[] The new sha3 hashes of the files associated with the token
   * @param _providerId (optional) string An ID that identifies which provider is
   *  minting this token
   * @param _providerMetadataId (optional) string An arbitrary provider-defined ID that
   *  identifies the metadata record stored by the provider
   */
  function modifyMetadataHashes(
    uint256 _tokenId,
    bytes32 _newNameHash,
    bytes32 _newDescriptionHash,
    bytes32[] _newFileHashes,
    string _providerId, // TODO: convert to bytes32?
    string _providerMetadataId  // TODO: convert to bytes32?
  )
    tokenExists(_tokenId)
    public onlyOwnerOf(_tokenId)
  {
    // nameHash is only overridden if it's not a blank string, since name is a
    //  required value
    //
    // NOTE: is this the best way to check for an empty bytes32 array?
    //  would (_newNameHash != "") be better in any way?
    //  see: https://ethereum.stackexchange.com/questions/27227/why-does-require-length-of-bytes32-0-not-work
    if (_newNameHash[0] != 0) {
      tokenData[_tokenId].nameHash = _newNameHash;
    }

    // descriptionHash can always be overridden since it's an optional value
    //  (e.g. you can "remove" a description by setting it to a blank string)
    tokenData[_tokenId].descriptionHash = _newDescriptionHash;

    // fileHashes is only overridden if it has more than one value, since at
    //  least one file (i.e. mainImage) is required
    //
    // NOTE: is this the best way to check for an empty bytes32 array?
    //  would (_newNameHash != "") be better in any way?
    //  see: https://ethereum.stackexchange.com/questions/27227/why-does-require-length-of-bytes32-0-not-work
    if (_newFileHashes.length > 0 && _newFileHashes[0][0] != 0) {
      tokenData[_tokenId].fileHashes = _newFileHashes;
    }

    if (bytes(_providerId).length != 0 && bytes(_providerMetadataId).length != 0) {
      emit Modified(
        msg.sender,
        _tokenId,
        tokenData[_tokenId].nameHash,
        tokenData[_tokenId].descriptionHash,
        tokenData[_tokenId].fileHashes,
        _providerId,
        _providerMetadataId
      );
    }
  }

  /**
   * @dev Gets the token given a token ID.
   * @param _tokenId token ID
   * @return CodexRecordData token data for the given token ID
   */
  function getTokenById(
    uint256 _tokenId
  )
    public
    view
    tokenExists(_tokenId)
    returns (bytes32 nameHash, bytes32 descriptionHash, bytes32[] fileHashes)
  {
    return (
      tokenData[_tokenId].nameHash,
      tokenData[_tokenId].descriptionHash,
      tokenData[_tokenId].fileHashes
    );
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
   * @dev This metadata will be a JSON blob that includes:
   *  name - Codex Record
   *  description - Information about the Provider that is hosting the off-chain metadata
   *  imageUri - A generic Codex Record image
   *
   * @param _tokenId uint256 ID of the token to query
   */
  function tokenURI(
    uint256 _tokenId
  )
    public
    view
    tokenExists(_tokenId)
    returns (string)
  {
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
