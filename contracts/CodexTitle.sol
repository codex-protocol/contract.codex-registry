pragma solidity ^0.4.21;

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

  mapping(uint256 => CodexTitleData) internal tokenData;

  /**
  * @dev Checks msg.sender can transfer a token, by being owner, approved, or operator
  * @param _tokenId uint256 ID of the token to validate
  */
  modifier canModify(uint256 _tokenId) {
    require(isApprovedOrOwner(msg.sender, _tokenId));
    _;
  }

  function CodexTitle() public ERC721Token("Codex Title", "CT") {

  }

  function addNewImageHash(uint256 _tokenId, bytes32 _imageHash) external canModify(_tokenId) {
    tokenData[_tokenId].imageHashes.push(_imageHash);
  }

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
  function getTokenById(uint256 _tokenId) public view returns (bytes32, bytes32, bytes32[]) {
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
    // For now, all new tokens will be the last entry in the array
    uint256 newTokenId = allTokens.length;

    // Add a new token to the allTokens array
    super._mint(_to, newTokenId);

    // Add new token data to the newly created token
    // Note that we aren't using the struct here so we can directly write to the imageHashes dynamic storage array
    tokenData[newTokenId].nameHash = _nameHash;
    tokenData[newTokenId].descriptionHash = _descriptionHash;
    tokenData[newTokenId].imageHashes.push(_imageHash);
  }
}
