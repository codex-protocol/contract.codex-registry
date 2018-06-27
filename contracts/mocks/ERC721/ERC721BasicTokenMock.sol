pragma solidity 0.4.24;

import "../../ERC721/ERC721BasicToken.sol";


/**
 * @title ERC721BasicTokenMock
 * This mock just provides a public mint function for testing purposes
 */
contract ERC721BasicTokenMock is ERC721BasicToken {
  function mint(address _to, uint256 _tokenId) public {
    require(_to != address(0));
    require(!exists(_tokenId));

    tokenOwner[_tokenId] = _to;
    ownedTokensCount[_to] = ownedTokensCount[_to].add(1);
    emit Transfer(address(0), _to, _tokenId);
  }
}
