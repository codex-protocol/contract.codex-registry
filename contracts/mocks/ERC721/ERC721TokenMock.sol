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
    require(_to != address(0));
    require(!exists(_tokenId));

    tokenOwner[_tokenId] = _to;
    ownedTokensCount[_to] = ownedTokensCount[_to].add(1);

    ownedTokensIndex[_tokenId] = ownedTokens[_to].length;
    ownedTokens[_to].push(_tokenId);

    allTokens.push(_tokenId);

    emit Transfer(address(0), _to, _tokenId);
  }

  function setTokenURI(uint256 _tokenId, string _uri) public {
    super._setTokenURI(_tokenId, _uri);
  }
}
