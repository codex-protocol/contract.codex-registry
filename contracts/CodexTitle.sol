pragma solidity ^0.4.18;

import "./zeppelin-solidity/token/ERC721/ERC721Token.sol";


contract CodexTitle is ERC721Token {
  struct CodexTitleData {
    string name;
    string description;
    string imageUri;
  }

  mapping(uint256 => CodexTitleData) internal tokenData;

  function CodexTitle() public ERC721Token("Codex Title", "CT") {

  }

  function mint(
    address _to, string _name, string _description, string _imageUri) public
  {
    uint256 tokenId = allTokens.length;

    super._mint(_to, tokenId);

    tokenData[tokenId] = CodexTitleData(_name, _description, _imageUri);
  }

  function getTokenById(uint256 _tokenId) external view
    returns (string name, string description, string imageUri)
  {
    CodexTitleData storage codexTitle = tokenData[_tokenId];

    return (codexTitle.name, codexTitle.description, codexTitle.imageUri);
  }
}
