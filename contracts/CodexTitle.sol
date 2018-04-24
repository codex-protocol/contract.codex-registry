pragma solidity ^0.4.23;

import "./ERC721/ERC721Token.sol";


/**
 * @title CodexTitle, an ERC721 token for arts & collectables
 * @dev This allows the token owner to optionally upgrade the token in the future
 *  if there are changes needed in the business logic. See the upgradeTo function
 *  for caveats.
 * See https://github.com/zeppelinos/labs/tree/master/upgradeability_using_inherited_storage
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

  mapping(uint256 => CodexTitleData) internal tokenData;

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
  * @dev Gets the token given a token ID.
  * @param _tokenId token ID
  * @return CodexTitleData token data for the given token ID
  */
  function getTokenById(uint256 _tokenId) public view
  returns (bytes32 nameHash, bytes32 descriptionHash, bytes32[] imageHashes) {
    CodexTitleData storage codexTitle = tokenData[_tokenId];

    return (codexTitle.nameHash, codexTitle.descriptionHash, codexTitle.imageHashes);
  }

  function mint(
    address _to,
    bytes32 _nameHash,
    bytes32 _descriptionHash,
    bytes32 _imageHash)
    public
  {
    this.mint(_to, _nameHash, _descriptionHash, _imageHash, '', '');
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
    string _providerId,
    string _providerMetadataId)
    public
  {
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
