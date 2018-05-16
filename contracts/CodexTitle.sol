pragma solidity ^0.4.23;

import "./ERC721/ERC721Token.sol";
import "./CodexToken.sol";


/**
 * @title CodexTitle, an ERC721 token for arts & collectables
 * @dev Developers should never interact with this smart contract directly!
 *  All transactions/calls should be made through TokenProxy. Storage will be maintained
 *  in that smart contract so that the Codex Protocol governing body has the ability
 *  to upgrade the contract in the future in the event of an emergency or new functionality.
 */
contract CodexTitle is ERC721Token {
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

  /**
  * @dev This event is emitted when a new token is minted and allows providers
  *  to discern which Minted events came from transactions they submitted vs
  *  transactions submitted by other platforms, as well as providing information
  *  about what metadata record the newly minted token should be associated with
  */
  event Minted(uint256 _tokenId, string _providerId, string _providerMetadataId);

  // Mapping from token ID to token data
  mapping(uint256 => CodexTitleData) internal tokenData;

  // Global tokenURIPrefix prefix. The token ID will be appended to the uri when accessed
  //  via the tokenURI method
  string public tokenURIPrefix;

  // Address of the ERC20 Codex Protocol Token, used for fees in the contract
  address public codexTokenAddress;

  // Implementation of ERC20 Codex Protocol Token, used for fees in the contract
  CodexToken public codexToken;

  // Address where all contract fees are sent, i.e., the Community Fund
  address public feeRecipient;

  // Fee to create new tokens. 10^18 = 1 token
  uint256 public creationFee = 0;

  /**
  * @dev Checks msg.sender can transfer a token, by being owner, approved, or operator
  * @param _tokenId uint256 ID of the token to validate
  */
  modifier canModify(uint256 _tokenId) {
    require(isApprovedOrOwner(msg.sender, _tokenId));
    _;
  }

  constructor() public ERC721Token("Codex Title", "CT") { }

  function modifyDescriptionHash(uint256 _tokenId, bytes32 _newDescriptionHash) external canModify(_tokenId) {
    tokenData[_tokenId].descriptionHash = _newDescriptionHash;

    emit Modified(msg.sender, _tokenId, ModifiedType.DESCRIPTION_CHANGE);
  }

  function modifyNameHash(uint256 _tokenId, bytes32 _newNameHash) external canModify(_tokenId) {
    tokenData[_tokenId].nameHash = _newNameHash;

    emit Modified(msg.sender, _tokenId, ModifiedType.NAME_CHANGE);
  }

  function addNewImageHash(uint256 _tokenId, bytes32 _imageHash) external canModify(_tokenId) {
    tokenData[_tokenId].imageHashes.push(_imageHash);

    emit Modified(msg.sender, _tokenId, ModifiedType.IMAGE_NEW);
  }

  // TODO: Is it necessary to have a separate getter for this?
  function getImageHashByIndex(uint256 _tokenId, uint256 _index) external view returns (bytes32) {
    bytes32[] memory imageHashes;
    (,,imageHashes) = getTokenById(_tokenId);

    return imageHashes[_index];
  }

  /**
  * @dev Sets the global tokenURIPrefix for use when returning token metadata.
  *  Only callable by the owner.
  * @param _tokenURIPrefix The new tokenURIPrefix
  */
  function setTokenURIPrefix(string _tokenURIPrefix) external onlyOwner {
    tokenURIPrefix = _tokenURIPrefix;
  }

  /**
  * @dev Sets the address of the ERC20 token used for fees in the contract.
  * @param _codexTokenAddress The address of the ERC20 Codex Protocol Token
  * @param _feeRecipient The address where the fees are sent
  * @param _creationFee The new creation fee. 10^18 is 1 token.
  */
  function setFees(address _codexTokenAddress, address _feeRecipient, uint256 _creationFee) external onlyOwner {
    codexTokenAddress = _codexTokenAddress;
    codexToken = CodexToken(codexTokenAddress);
    feeRecipient = _feeRecipient;
    creationFee = _creationFee;
  }

  /**
  * @dev Sets the creation fee in CODX
  * @param _creationFee The new creation fee. 10^18 is 1 token.
  */
  function setCreationFee(uint256 _creationFee) external onlyOwner {
    creationFee = _creationFee;
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
