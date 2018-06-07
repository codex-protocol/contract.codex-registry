pragma solidity 0.4.24;

import "./UpgradedTokenMock.sol";


contract UpgradedTokenMockV2 is UpgradedTokenMock {
  constructor(string _name, string _symbol) public
    UpgradedTokenMock(_name, _symbol)
  { }

  /**
   * Notice here that instead of calling super.mint, we are skipping
   *  a level in the inheritance model and going to super + 1.
   *
   * It's easy to see that things can quickly get out of hand for upgrades
   *  but this is an important test to have in the event we want to bypass
   *  the logic defined in the previous contract.
   */
  function mint(address _to, uint256 _tokenId) payable public {
    ERC721TokenMock.mint(_to, _tokenId);
  }
}
