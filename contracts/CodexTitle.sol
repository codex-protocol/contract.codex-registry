pragma solidity ^0.4.19;

import "./CodexTitleCore.sol";


contract CodexTitle is CodexTitleCore {
  function createToken(string _name, string _description, string _imageUri) external {
    codexTitles.push(CodexTitle(_name, _description, _imageUri));

    Transfer(address(0), msg.sender, codexTitles.length - 1);
  }

  function getTokenById(uint256 _tokenId) external view tokenIndexInSupply(_tokenId)
  returns (string name, string description, string imageUri) {

    CodexTitle storage codexTitle = codexTitles[_tokenId];

    return (
      codexTitle.name,
      codexTitle.description,
      codexTitle.imageUri
    );
  }
}
