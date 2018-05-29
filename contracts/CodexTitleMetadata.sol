pragma solidity ^0.4.24;

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

  event Modified(
    address indexed _from,
    uint256 _tokenId,
    bytes32 _newNameHash,
    bytes32 _newDescriptionHash,
    bytes32[] _newImageHashes,
    string _providerId, // TODO: convert to bytes32?
    string _providerMetadataId // TODO: convert to bytes32?
  );

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

  /**
   * @dev Updates token metadata hashes to whatever is passed in
   * @param _providerId (optional) An ID that identifies which provider is
   *  minting this token
   * @param _providerMetadataId (optional) An arbitrary provider-defined ID that
   *  identifies the metadata record stored by the provider
   */
  function modifyMetadataHashes(
    uint256 _tokenId,
    bytes32 _newNameHash,
    bytes32 _newDescriptionHash,
    bytes32[] _newImageHashes,
    string _providerId, // TODO: convert to bytes32?
    string _providerMetadataId // TODO: convert to bytes32?
  )
    public canModify(_tokenId)
  {

    require(exists(_tokenId));

    // nameHash is only overridden if it's not a blank string, since name is a
    //  required value
    //
    // @dev: is this the best way to check for an empty bytes32 array?
    //  would (_newNameHash != "") be better in any way?
    //  see: https://ethereum.stackexchange.com/questions/27227/why-does-require-length-of-bytes32-0-not-work
    if (_newNameHash[0] != 0) {
      tokenData[_tokenId].nameHash = _newNameHash;
    }

    // descriptionHash can always be overridden since it's an optional value
    //  (e.g. you can "remove" a description by setting it to a blank string)
    tokenData[_tokenId].descriptionHash = _newDescriptionHash;

    // imageHashes is only overridden if it has more than one value, since at
    //  least one image (i.e. mainImage) is required
    //
    // @dev: is this the best way to check for an empty bytes32 array?
    //  would (_newNameHash != "") be better in any way?
    //  see: https://ethereum.stackexchange.com/questions/27227/why-does-require-length-of-bytes32-0-not-work
    if (_newImageHashes.length > 0 && _newImageHashes[0][0] != 0) {
      tokenData[_tokenId].imageHashes = _newImageHashes;
    }

    if (bytes(_providerId).length != 0 && bytes(_providerMetadataId).length != 0) {
      emit Modified(
        msg.sender,
        _tokenId,
        tokenData[_tokenId].nameHash,
        tokenData[_tokenId].descriptionHash,
        tokenData[_tokenId].imageHashes,
        _providerId,
        _providerMetadataId
      );
    }
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
   * @dev This metadata will be a JSON blob that includes:
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
