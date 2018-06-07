pragma solidity 0.4.24;

import "../../ERC721/ERC721Token.sol";


/**
 * @title ERC721TokenMock
 * This mock just provides a public mint function for testing purposes
 */
contract ERC721TokenMock is ERC721Token {
  constructor(string _name, string _symbol) public
    ERC721Token(_name, _symbol)
  { }

  function mint(address _to, uint256 _tokenId) payable public {
    super._mint(_to, _tokenId);
  }

  function setTokenURI(uint256 _tokenId, string _uri) public {
    super._setTokenURI(_tokenId, _uri);
  }
}
